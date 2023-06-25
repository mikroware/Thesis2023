using System;
using System.Collections.Generic;
using App.Viewer;
using com.csutil;
using Mapbox.Unity.Map;
using Mapbox.Utils;
using TMPro;
using UnityEngine;
using Utils;

namespace App
{
    public class ClientSyncManager : MonoBehaviour
    {
        public DataManager dataManager;
        public Camera clientCamera;
        public AbstractMap map;

        public GameObject objectToRender;
        public GameObject labelPrefab;
        
        public ClickMesh clickMesh;

        public Canvas labelCanvas;

        private Dictionary<long, GameObject> _managedClients = new Dictionary<long, GameObject>();
        private Dictionary<long, GameObject> _managedLabels = new Dictionary<long, GameObject>();

        private float prevZoom;
        private Vector2d prevPan;

        private void Start()
        {
            if (!map)
            {
                map = FindObjectOfType<AbstractMap>();
            }

            if (!clientCamera)
            {
                clientCamera = FindObjectOfType<DetectVR>().GetCamera();
            }

            if (!clickMesh)
            {
                clickMesh = FindObjectOfType<ClickMesh>();
            }
            
            if (!dataManager || !clientCamera || !map)
            {
                Debug.LogWarning("ClientSyncManager does not have a DataManager or Camera or AbstractMap set");
                return;
            }
        
            InvokeRepeating(nameof(SyncClient), 3.0f, 0.1f);
        
            dataManager.OnSocketEventType("clientSync", (data) =>
            {
                // TODO: do something with the client sync info

                var id = data["client"].i;
                if (!_managedClients.ContainsKey(id))
                {
                    var obj = Instantiate(objectToRender);
                    obj.transform.localScale = new Vector3(0.5f, 0.5f, 0.5f);
                    
                    Debug.Log($"Client connected {id}");

                    _managedClients.Add(id, obj);
                }

                var pos = data["meta"]["position"];
                var rot = data["meta"]["rotation"];
                var height = data["meta"]["height"].f;
                
                var activeItem = data["meta"]["activeItem"].str;
                if (activeItem.Length > 0)
                {
                    if (_managedLabels.ContainsKey(id))
                    {
                        // Update the label if item changed
                        var ai = _managedLabels[id].GetComponent<SyncActiveItem>();
                        if (ai != null && !ai.lastActiveItemName.Equals(activeItem))
                        {
                            ai.SetItem(activeItem, dataManager.GetById(activeItem), id, labelCanvas);
                        }
                    }
                    else
                    {
                        // Create a new label
                        var obj = Instantiate(labelPrefab);
                        obj.AddComponent<SyncActiveItem>().SetItem(activeItem, dataManager.GetById(activeItem), id, labelCanvas);
                        _managedLabels.Add(id, obj);
                    }
                }
                else
                {
                    if (_managedLabels.ContainsKey(id))
                    {
                        Destroy(_managedLabels[id]);
                        _managedLabels.Remove(id);
                    }
                }
            
                // var world = map.GeoToWorldPosition(new Vector2d(pos["x"].f, pos["y"].f));
                var world = new Vector3(pos["x"].f, height, pos["y"].f);
                var clientTransform = _managedClients[id].transform;

                clientTransform.position = world;
                clientTransform.rotation = JSONObjectUtils.ToQuaternion(rot);
            });

            dataManager.OnSocketEventType("mapSync", (data) =>
            {
                var pan = data["meta"]["pan"];
                map.UpdateMap(new Vector2d(pan["x"].f, pan["y"].f), data["meta"]["zoom"].f);
            });

            dataManager.OnSocketEventType("clientDisconnected", (data) =>
            {
                var id = data["client"].i;
                
                if (_managedLabels.ContainsKey(id))
                {
                    Destroy(_managedLabels[id]);
                    _managedLabels.Remove(id);
                }
                
                if (!_managedClients.ContainsKey(id)) return;
                
                Destroy(_managedClients[id]);
                _managedClients.Remove(id);
            });
            
            map.OnUpdated += () =>
            {
                // Only sync map if values change
                if (!(Math.Abs(prevZoom - map.Zoom) > 0.001) && prevPan.Equals(map.CenterLatitudeLongitude)) return;

                prevZoom = map.Zoom;
                prevPan = map.CenterLatitudeLongitude;
                    
                SyncMap();
            };
        }

        private void SyncClient()
        {
            var clientTransform = clientCamera.transform;
            var position = clientTransform.position;

            // Debug.Log($"Sending position {position.x}, {position.y}, {position.z}");
            
            // TODO: send VR hand data
            // TODO: send current selected entity data
            
            dataManager.SocketSendToServer(new Dto.Client.ClientSync
            {
                // position = map.WorldToGeoPosition(position),
                position = new Vector2d(position.x, position.z),
                rotation = clientTransform.rotation,
                height = position.y,
                activeItem = clickMesh.GetLastActiveName(),
            });

            // TODO: REMOVE IS FOR LOCAL TESTING
            // var activeItem = clickMesh.GetLastActiveName();
            // if (activeItem?.Length > 0)
            // {
            //     if (_managedLabels.ContainsKey(1337))
            //     {
            //         // Update the label if item changed
            //         var ai = _managedLabels[1337].GetComponent<SyncActiveItem>();
            //         if (ai != null && !ai.lastActiveItemName.Equals(activeItem))
            //         {
            //             ai.SetItem(activeItem, dataManager.GetById(activeItem), 1337, labelCanvas);
            //         }
            //     }
            //     else
            //     {
            //         // Create a new label
            //         var obj = Instantiate(labelPrefab);
            //         obj.AddComponent<SyncActiveItem>().SetItem(activeItem, dataManager.GetById(activeItem), 1337, labelCanvas);
            //         _managedLabels.Add(1337, obj);
            //     }
            // }
            // else
            // {
            //     if (_managedLabels.ContainsKey(1337))
            //     {
            //         Destroy(_managedLabels[1337]);
            //         _managedLabels.Remove(1337);
            //     }
            // }
        }

        private void SyncMap()
        {
            dataManager.SocketSendToServer(new Dto.Client.MapSync
            {
                zoom = map.Zoom,
                pan = map.CenterLatitudeLongitude,
            });
        }
    }
}
