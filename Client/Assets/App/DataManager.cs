using System;
using System.Collections;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using App.Data;
using App.Dto.Client;
using App.Events;
using com.csutil;
using GeoJSON;
using JetBrains.Annotations;
using NativeWebSocket;
using UnityEngine;
using UnityEngine.SceneManagement;
using Utils.GeoJSON;
using Debug = UnityEngine.Debug;

namespace App
{
    public class DataManager : MonoBehaviour
    {
        public TestData heightData;

        public SystemStateManager systemState;

        public GameObject pointPrefab;

        private WebSocket _webSocket;
        private int _webSocketAttemptCount = 0;

        private EventBus _eventBus;
        private LayerManager _layerManager;
        private MetricsManager _metricsManager;

        private Dictionary<string, GeoJsonRenderer> _managedShapes;
        private GameObject _geoPrefab;
        private GameObject _objectPrefab;

        private JSONObject _tempInitData;

        private ApplicationConfig _applicationConfig;

        private Dictionary<string, List<Action<JSONObject>>> _socketEvents = new Dictionary<string, List<Action<JSONObject>>>();

        private void Awake()
        {
            _eventBus = (EventBus) EventBus.instance;
            _layerManager = FindObjectOfType<LayerManager>();
            _metricsManager = FindObjectOfType<MetricsManager>();
        
            _managedShapes = new Dictionary<string, GeoJsonRenderer>();

            systemState = gameObject.GetComponent<SystemStateManager>();
        }

        public async Task<JSONObject> PostToServer(string endpoint, object data)
        {
            var serverUrl = _applicationConfig.serverUrl;
            var request = new Uri($"http://{serverUrl}/{endpoint}").SendPOST().WithJsonContent(data);

            try
            {
                await request.GetResult<HttpStatusCode>();
            }
            catch (Exception e)
            {
                // Ignore all exceptions for now as it also blocks 400
            }
        
            return JSONObject.Create(await request.GetResult<string>());
        }

        private async void LoadFile(string fileName, string type, bool update)
        {
            var serverUrl = _applicationConfig.serverUrl;
            var timeStart = Time.realtimeSinceStartup;
        
            Debug.Log($"Before: {Time.realtimeSinceStartup}");
            var request = new Uri($"http://{serverUrl}/cache/{fileName}").SendGET();
            var response = await request.GetResult<string>();
            
            Debug.Log($"Before deserialize: {Time.realtimeSinceStartup}");
            var timeFetchDone = Time.realtimeSinceStartup;

            if (type == "object")
            {
                LoadOtherFile(response);
                return;
            }

            // Go into a background thread for parsing
            // TODO: decide if this is even useful (cannot include fetch as error)
            await new WaitForBackgroundThread();
            var collection = GeoJSON.GeoJSONObject.Deserialize(response);
            await new WaitForUpdate();
        
            Debug.Log($"After: {Time.realtimeSinceStartup}");
            var timeDeserializeDone = Time.realtimeSinceStartup;

            // Debug.Log("GeoJSON type is " + collection.features[0].type);
            // Debug.Log("First geometry is " + collection.features[0].geometry.type);
            // Debug.Log("ID is " + collection.features[0].id);
            // Debug.Log("Property naam is " + collection.features[0].properties["bu_naam"]);

            if (collection.features[0].geometry.type == "MultiPolygon")
            {
                var multi = (MultiPolygonGeometryObject) collection.features[0].geometry;
                // Debug.Log("First geo position is " + multi.polygons[0].FirstPosition());
            }

            if (_geoPrefab == null)
            {
                _geoPrefab = new GameObject("GeoRenderedPrefab", new [] 
                {
                    typeof(GeoJsonRenderer)
                });
            
                // Testing if adding MeshFilter in the prefab helps
                // _geoPrefab.AddComponent<MeshFilter>();
                // MarkerPosition.AddComponent(gameObject, 0, 10);

                _geoPrefab.transform.parent = transform;
            }
        
            foreach(var featureObject in collection.features)
            {
                // TODO: At the moment points are updated by updating the whole source/dataset, make exception here and not re-create the object
                if (featureObject.geometry.type == "Point" && _managedShapes.ContainsKey(featureObject.id))
                {
                    _managedShapes[featureObject.id].GetComponent<GeoJsonRenderer>().UpdateFeatureObject(featureObject);
                    
                    // TODO: visuals are now skipped, but those should be refactored anyways?

                    if (_tempInitData && _tempInitData.HasField("visuals"))
                    {
                        var setKey = featureObject.id.Split('-')[0];
                        var visualsData = _tempInitData.GetField("visuals")[int.Parse(setKey)];
                        
                        if (visualsData != null && visualsData.HasField("types"))
                        {
                            if (
                                visualsData.HasField("values")
                                && visualsData.GetField("types")[0].HasField("visualize")
                                && visualsData.GetField("types")[0].GetField("visualize").str == "color"
                            )
                            {
                                var values = visualsData.GetField("values");
                                if (values.HasField(featureObject.id))
                                {
                                    _managedShapes[featureObject.id].UpdateColor(values.GetField(featureObject.id)[0][0].str);
                                }
                            }
                            
                            var sizeType = visualsData.GetField("types").list.Find(vType => vType.GetField("visualize").str == "size");
                            if (sizeType != null)
                            {
                                _managedShapes[featureObject.id].UpdateSize(sizeType);
                            }
                        }
                    }

                    continue;
                }
                
                var instance = Instantiate(_geoPrefab, transform);

                instance.name = featureObject.id;//properties.GetValue("gml_id", "No name");

                // var instance = new GameObject(featureObject.properties["naam"], new []
                // {
                //     typeof(GeoJsonRenderer)
                // }); //Instantiate(GameObject, transform);
                // // var geoJsonRenderer = instance.AddComponent<GeoJsonRenderer>();
                //
                // instance.transform.parent = transform;
                var comp = instance.GetComponent<GeoJsonRenderer>();
                comp.SetFeatureObject(featureObject);
            
                // TODO: create helper function for this probably, structure the socket event data way better
                if (_tempInitData && _tempInitData.HasField("visuals"))
                {
                    var setKey = featureObject.id.Split('-')[0];
                    var visualsData = _tempInitData.GetField("visuals")[int.Parse(setKey)];
                    if (
                        visualsData != null
                        && visualsData.HasField("types") 
                        && visualsData.HasField("values") 
                        && visualsData.GetField("types")[0].HasField("visualize")
                        && visualsData.GetField("types")[0].GetField("visualize").str == "color"
                        )
                    {
                        var values = visualsData.GetField("values");
                        if (values.HasField(featureObject.id))
                        {
                            comp.UpdateColor(values.GetField(featureObject.id)[0][0].str);
                        }
                    }
                    
                    if (visualsData != null && visualsData.HasField("types"))
                    {
                        var sizeType = visualsData.GetField("types").list.Find(vType => vType.GetField("visualize").str == "size");
                        if (sizeType != null)
                        {
                            comp.UpdateSize(sizeType);
                        }
                    }
                }

                if (_tempInitData && _tempInitData.HasField("filter"))
                {
                    var filter = _tempInitData.GetField("filter");
                    if (filter.GetField("hide")?.GetField(featureObject.id))
                    {
                        comp.gameObject.SetActive(false);
                    }
                }

                // Remove an old object // TODO: replace if changed probably for performance
                if (_managedShapes.ContainsKey(featureObject.id))
                {
                    _managedShapes[featureObject.id].gameObject.Destroy();
                    _managedShapes.Remove(featureObject.id);
                }
            
                _managedShapes.Add(featureObject.id, comp);
            }

            var timeAllDone = Time.realtimeSinceStartup;
            _metricsManager.SendLoadFile(fileName, timeFetchDone - timeStart, timeDeserializeDone - timeStart, timeAllDone - timeStart);
        }

        private async void LoadOtherFile(string response)
        {
            await new WaitForBackgroundThread();
            var objects = JSONObject.Create(response);
            await new WaitForUpdate();
            
            if (_objectPrefab == null)
            {
                _objectPrefab = new GameObject("ObjectRenderedPrefab", new [] 
                {
                    typeof(ObjectRenderer)
                });

                _objectPrefab.transform.parent = transform;
            }

            objects.list.ForEach(obj => 
            {
                var instance = Instantiate(_objectPrefab, transform);

                instance.name = obj.GetField("id").str;

                var comp = instance.GetComponent<ObjectRenderer>();
                comp.SetObj(obj);
            });
        }

        private IEnumerator ReconnectSocket(float time)
        {
            yield return new WaitForSeconds(time);

            if (gameObject != null && gameObject.activeInHierarchy)
            {
                InternalEvent.Publish(new InternalDto
                {
                    connecting = true,
                });

                _webSocket.Connect();
            }
            else
            {
                Debug.Log("Not reconnecting socket because DataManager closed");
            }
        }

        private async void Start()
        {
            // Read the desired data server from the application config (set in another scene)
            _applicationConfig = FindObjectOfType<ApplicationConfig>();
            if(!_applicationConfig) throw new Exception("Cannot find ApplicationConfig in scene!");

            var detectVr = FindObjectOfType<DetectVR>();

            var serverUrl = _applicationConfig.serverUrl;

            Debug.Log($"Starting DataManager for server '{serverUrl}'");
        
            // TODO: implement this in cscore DataStore redux like
            InternalEvent.Publish(new InternalDto
            {
                connecting = true,
            });

            try
            {
                _webSocketAttemptCount = 0;
                _webSocket = new WebSocket($"ws://{serverUrl}/socket?unity=true&vr={detectVr.IsVr()}");
            }
            catch (UriFormatException e)
            {
                _applicationConfig.latestServerConnectionError = "Server URL was not valid.";
                SceneManager.LoadSceneAsync("StartScreen");
                return;
            }

            _webSocket.OnOpen += () =>
            {
                Debug.Log("Socket connection opened");
            
                Events.InternalEvent.Publish(new InternalDto
                {
                    connected = true,
                    connecting = false,
                });

                var data = new TestDataConnect
                {
                    type = "INFO",
                    client = "unity",
                };

                Debug.Log(JsonUtility.ToJson(data));
                _webSocket.SendText(JsonUtility.ToJson(data));
            };

            _webSocket.OnError += e =>
            {
                Debug.Log("Socket error! " + e);
                _applicationConfig.latestServerConnectionError = e;
            };

            _webSocket.OnClose += e =>
            {
                Events.InternalEvent.Publish(new InternalDto
                {
                    connected = false,
                    connecting = false,
                });
            
                if (!this)
                {
                    Debug.Log("Socket closed because DataManager was destroyed");
                }
                else
                {
                    // First try to reconnect, after a few failed attempts, go back to the start screen
                    if (_webSocketAttemptCount >= 3)
                    {
                        SceneManager.LoadSceneAsync("StartScreen");
                    }
                    else
                    {
                        Debug.Log("Socket closed, will attempt to reconnect");
                    
                        _webSocketAttemptCount += 1;
                        StartCoroutine(ReconnectSocket(2));
                    }
                }
            };

            _webSocket.OnMessage += data =>
            {
                var timeStart = Time.realtimeSinceStartup;
                
                var message = System.Text.Encoding.UTF8.GetString(data);
                // Debug.Log("Message: " + message);

                // var basic = JsonUtility.FromJson<Dto.Server.Type>(message);
                var json = JSONObject.Create(message);
                var type = json.GetField("type").str;
                var handled = true;
            
                switch (type)
                {
                    case "system":
                        ProcessSystem(json);
                        break;
                    case "init":
                        ProcessInit(json);
                        break;
                    case "dataset":
                        ProcessDataset(json);
                        break;
                    case "visuals":
                        ProcessVisuals(json);
                        break;
                    case "filter":
                        ProcessFilter(json);
                        break;
                    case "layer":
                        _layerManager.DataUpdateFromServer(json);
                        break;
                    default:
                        handled = false;
                        break;
                }

                if (type == "visuals")
                {
                    var timeAllDone = Time.realtimeSinceStartup;
                    _metricsManager.SendLoadVisuals(timeAllDone - timeStart);
                }
            
                // Now call all the registered events
                _socketEvents.GetValue(type, new List<Action<JSONObject>>()).ForEach(action =>
                {
                    handled = true;
                    action(json);
                });

                if (!handled)
                {
                    Debug.Log($"Nothing handled socket message of type '{type}'");
                    Debug.Log($"The message was: {message}");
                }

                // var info = JsonUtility.FromJson<OnConnect>(System.Text.Encoding.UTF8.GetString(data));
                // Debug.Log(info.ToString());
                // Debug.Log(JsonUtility.ToJson(info));
                //
                // var testJson = JsonConvert.SerializeObject(new
                // {
                //     test = "TEST",
                //     something = "working",
                // });
                // Debug.Log(testJson);
                // Debug.Log(JsonConvert.DeserializeObject(testJson));

            
                // TODO: do more even testing
                // _eventBus.Publish("SOMETHING_CHANGED", new
                // {
                //     test = "Yo"
                // });
                //
                // Events.Test.Publish(new
                // {
                //     test = "Event class"
                // });
                //
                // Events.TestAnother.Publish("TEST ANOTHER DATA");
            };

            await _webSocket.Connect();
        }

        public void OnSocketEventType(string type, Action<JSONObject> cb)
        {
            if (!_socketEvents.ContainsKey(type))
            {
                _socketEvents[type] = new List<Action<JSONObject>>();
            }

            _socketEvents[type].Add(cb);
        }

        public void SocketSendToServer(object data)
        {
            if (_webSocket == null || _webSocket.State != WebSocketState.Open) return;

            _webSocket.SendText(JsonUtility.ToJson(data));
        }

        private void ProcessSystem(JSONObject json)
        {
            Events.System.Publish(json.GetField("system"));
        }

        private void ProcessInit(JSONObject json)
        {
            _tempInitData = json;

            ProcessDataset(json, true);
        }
        
        private void ProcessDataset(JSONObject json, bool initial = false)
        {
            Debug.Log("Starting ProcessDataset");

            json.GetField("dataset")?.list.ForEach(set =>
            {
                if (set.HasField("cacheFile"))
                {
                    if (set.GetField("enabled")?.b ?? false)
                    {
                        if (initial || !(set.GetField("cache")?.b ?? false))
                        {
                            LoadFile(set.GetField("cacheFile").str, set.GetField("type").str, !initial);
                        }
                    }
                }
                else
                {
                    Debug.Log("This dataset does not contain a cacheFile, cannot load");
                }
            });
        
            // TODO: Save dataset info - do the actual loading here
            // TODO: Save config info
            // Etc..
        
            // TODO: use this somehow directly when creating a dataset here
            // For now save it
            // ProcessVisuals(json);
        }

        private void ProcessVisuals(JSONObject json)
        {
            Debug.Log("Starting ProcessVisuals");
        
            // == This is thru Unity parser, but does not accept dynamic objects
            // var info = JsonUtility.FromJson<Dto.Server.TypeVisuals>(message);
        
            // == This is thru Mapbox parser, but returns plain objects (need parser on that..)
            // var info1 = JsonConvert.DeserializeObject(message);
            // Debug.Log("Dto get type: " + info1?.GetType().GetProperty("type")?.GetValue(info1, null));
            // var mapped = info1.MapViaJsonInto<Dto.Server.TypeVisuals>();
            // Debug.Log("Dto is this: " + JsonConvert.SerializeObject(info1));
            // Debug.Log("Dto is this: " + JsonConvert.SerializeObject(mapped.visuals));
        
            // == This is thru Newtonsoft parser, which as most potential, but requires some more knowledge/effort
            // var info2 = Newtonsoft.Json.JsonConvert.DeserializeObject<Dto.Server.TypeVisuals>(message);
            // Debug.Log("Dto is this: " + Newtonsoft.Json.JsonConvert.SerializeObject(info2));
            // Debug.Log("Dto parser ids: " + info.visuals[2].values.Keys.ToString());
        
            if (!json.HasField("visuals"))
            {
                Debug.Log("[ProcessVisuals] No visuals key");
                return;
            }

            var index = 0;
            json.GetField("visuals").list.ForEach(visualsData =>
            {
                if (!visualsData.HasField("types") || !visualsData.HasField("values"))
                {
                    Debug.Log($"[ProcessVisuals] Visual item {index} has no types or values field");
                    index++;
                    return;
                }

                index++;

                if (
                    visualsData.GetField("types")[0].HasField("visualize")
                    && visualsData.GetField("types")[0].GetField("visualize").str == "color"
                )
                {
                    var values = visualsData.GetField("values");
                    foreach (var id in values.keys)
                    {
                        if (_managedShapes.ContainsKey(id))
                        {
                            _managedShapes[id].UpdateColor(values[id][0][0].str);
                        }
                        else
                        {
                            Debug.Log("[ProcessVisuals] DataManager is not managing id: " + id);
                        }
                    }
                }

                // Size type
                var sizeType = visualsData.GetField("types").list.Find(vType => vType.GetField("visualize").str == "size");
                if (sizeType != null)
                {
                    var values = visualsData.GetField("values");
                    foreach (var id in values.keys)
                    {
                        if (_managedShapes.ContainsKey(id))
                        {
                            _managedShapes[id].UpdateSize(sizeType);
                        }
                    }
                }

                // TODO: handle other visuals
            });
        }
    
        private void ProcessFilter(JSONObject json)
        {
            Debug.Log("Starting ProcessFilter");

            if (!json.HasField("filter"))
            {
                Debug.Log("[ProcessFilter] No filter key");
                return;
            }
        
            var hidden = json.GetField("filter")?.GetField("hide");
            if (!hidden || hidden == null) return;

            foreach (var entry in _managedShapes)
            {
                if (hidden.HasField(entry.Key))
                {
                    entry.Value.gameObject.SetActive(false);
                }
                else
                {
                    entry.Value.gameObject.SetActive(true);
                }
            }
        }

        [CanBeNull]
        public GeoJsonRenderer GetById(string id)
        {
            return _managedShapes.ContainsKey(id) ? _managedShapes[id] : null;
        }

        private void Update()
        {
#if !UNITY_WEBGL || UNITY_EDITOR
            _webSocket?.DispatchMessageQueue();
#endif
        }

        private async void OnApplicationQuit()
        {
            await _webSocket.Close();
        }
    }
}
