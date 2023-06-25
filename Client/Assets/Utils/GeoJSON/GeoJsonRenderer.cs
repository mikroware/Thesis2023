using System;
using System.Collections.Generic;
using System.Linq;
using App;
using App.Viewer;
using com.csutil;
using GeoJSON;
using Mapbox.Unity.Utilities;
using Mapbox.Utils;
using UniRx.Triggers;
using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit;
using Debug = UnityEngine.Debug;

namespace Utils.GeoJSON
{
    public class GeoJsonRenderer : MonoBehaviour
    {
        private Vector2[] _vertices;

        private MeshRenderer _meshRenderer;

        private FeatureObject _featureObject;

        private GameObject _visualInstance;

        private ClickMesh _clickMesh;
        
        private bool isVr = false;

        // TODO: add API for this so a manager can change it
        // public Vector2d location = Conversions.StringToLatLon("52.002095, 4.351982");
        // public Vector2d location = Conversions.StringToLatLon("52.056168,5.206411"); // for Buurten data
        public Vector2d location = Conversions.StringToLatLon("52.15616055555555,5.38763888888889"); // for campus data

        private float _height = 50f;
        
        // TODO: change this to a normal one and check in update on change
        // ... so it is shown in the inspector?
        // ... and/or add an API so a manager can change it
        public float Height
        {
            get => _height;
            set
            {
                _height = value;
                HeightUpdated();
            }
        }

        private Color? _prevColor = null; 
        private bool _visibleActive = false;
        public bool VisibleActive
        {
            get => _visibleActive;
            set
            {
                _visibleActive = value;
                if(_markerPosition) 
                    Height = value ? Height * 2 : Height / 2;

                // Set color to red
                if (value)
                {
                    _prevColor = _meshRenderer.material.GetColor(Color1);
                    _meshRenderer.material.SetColor(Color1, new Color(255, 0, 0));
                }
                else if(_prevColor != null){
                    _meshRenderer.material.SetColor(Color1, (Color) _prevColor);
                    _prevColor = null;
                }
            }
        }

        // private TestData _scriptable;

        private MarkerPosition _markerPosition;
        private static readonly int Color1 = Shader.PropertyToID("_BaseColor");
        private static readonly int BaseMap = Shader.PropertyToID("_BaseMap");
        private static readonly int Surface = Shader.PropertyToID("_Surface");
        private static readonly int Blend = Shader.PropertyToID("_Blend");

        public void SetFeatureObject(FeatureObject featureObject)
        {
            _featureObject = featureObject;
            CreateMesh();
        }

        public Dictionary<string, string> GetFeatureProperties()
        {
            return _featureObject.properties;
        }

        private void Awake()
        {
            // Add mesh components if they were not added manually
            if (!GetComponent<MeshRenderer>())
            {
                gameObject.AddComponent<MeshRenderer>()
                    .sharedMaterial = new Material(Shader.Find("Universal Render Pipeline/Lit"));
            }

            if (!GetComponent<MeshFilter>())
            {
                gameObject.AddComponent<MeshFilter>();
            }

            if (!GetComponent<MeshCollider>())
            {
                gameObject.AddComponent<MeshCollider>();
            }
            
            // TODO: Make marker position behaviour part of this mono behaviour probably
            if (!GetComponent<MarkerPosition>())
            {
                _markerPosition = MarkerPosition.AddComponent(gameObject, 0, Height);
                _markerPosition.location = location;
                _markerPosition.scale = 1f;
                _markerPosition.UpdatePosition();
            }
            else
            {
                _markerPosition = GetComponent<MarkerPosition>();
                _markerPosition.location = location;
                _markerPosition.scale = 1f;
            }

            _meshRenderer = GetComponent<MeshRenderer>();
            
            // CreateMesh();

            // _scriptable = ScriptableObject.CreateInstance<TestData>();
            // _scriptable = Resources.FindObjectsOfTypeAll<TestData>().FirstOrDefault();
            
            // TODO: testing
            // _scriptable = ScriptableSingleton<TestData>();
            //_scriptable.someDefaultHeight = 21f;
            // Debug.Log(_scriptable.someDefaultHeight);

            _clickMesh = FindObjectOfType<ClickMesh>();

            if (FindObjectOfType<DetectVR>().IsVr())
            {
                isVr = true;
                
                if (!GetComponent<XRSimpleInteractable>())
                {
                    gameObject.AddComponent<XRSimpleInteractable>();
                }
                
                AddXrsi(gameObject);
            }
        }

        private void AddXrsi(GameObject obj)
        {
            var xrsi = obj.GetComponent<XRSimpleInteractable>();
                
            xrsi.firstHoverEntered.AddListener(XRHoverEntered);
            xrsi.lastHoverExited.AddListener(XRHoverExited);
            xrsi.selectEntered.AddListener(XRSelectEntered);
            xrsi.selectExited.AddListener(XRSelectExited);
        }

        private void XRHoverEntered(HoverEnterEventArgs args)
        {
            VisibleActive = true;
            _clickMesh.SetLastActive(this, name);
        }

        private void XRHoverExited(HoverExitEventArgs args)
        {
            VisibleActive = false;
            _clickMesh.SetLastActive(null, null);
        }
        
        private void XRSelectEntered(SelectEnterEventArgs args)
        {
            _clickMesh.EnableCanvas(this, transform.position);
        }

        private void XRSelectExited(SelectExitEventArgs args)
        {
            _clickMesh.DisableCanvas();
        }

        private void CreateMesh()
        {
            if (!GetComponent<MeshFilter>())
            {
                Debug.Log("No MeshFilter on " + name);
                return;
            }
            else
            {
                // Debug.Log("YES MeshFilter on " + this.name);
                
                if (!GetComponent<MarkerPosition>())
                {
                    Debug.Log("No MarkerPosition on " + name);
                    return;
                }
            }

            if (_featureObject == null)
            {
                Debug.Log("No featureObject on " + name);
                return;
            }
            
            // TODO: temporarily use some property for height
            Height = float.Parse(_featureObject.properties.GetValue("AANT_INW", "10000")) / 5000;
            HeightUpdated();
            
            // TODO: temporarily color stuff based on a property
            // var width = float.Parse(_featureObject.properties.GetValue("avg_width", "1"));
            // switch (width)
            // {
            //     case float n when (n < 1.5):
            //         GetComponent<MeshRenderer>().material.color = Color.red;
            //         break;
            //     case float n when (n < 2.0):
            //         GetComponent<MeshRenderer>().material.color = Color.yellow;// new Color(150, 150, 0);
            //         break;
            //     default:
            //         GetComponent<MeshRenderer>().material.color = Color.cyan;
            //         break;
            // }
            
            // Handle points separately
            if (_featureObject.geometry.type == "Point")
            {
                // var prefab = (GameObject) Resources.Load("PolygonStarter/Prefabs/SM_PolygonPrototype_Prop_Cone_01");

                var point = (PointGeometryObject) _featureObject.geometry;
                
                
                // var meshPoint = new GeoJsonMesh(new []
                // {
                //     new Vector2(0, 0), 
                //     new Vector2(10, 0), 
                //     new Vector2(10, 10), 
                //     new Vector2(0, 10),
                // }).AddUvs().ConvertToExtruded(true).GetMesh();
                //
                // GetComponent<MeshFilter>().mesh = meshPoint;
                // GetComponent<MeshCollider>().sharedMesh = meshPoint;

                
                var ob = transform.parent.gameObject.GetComponent<DataManager>().pointPrefab;
                _visualInstance = Instantiate(ob, transform);
                _visualInstance.transform.localPosition = Vector3.zero;
                _visualInstance.transform.localScale = Vector3.one;

                if (isVr)
                {
                    _visualInstance.AddComponent<XRSimpleInteractable>();
                    AddXrsi(_visualInstance);
                }
                
                _visualInstance.AddComponent<VisualObjectParent>().parentName = name;

                _meshRenderer = _visualInstance.GetComponent<MeshRenderer>();
                var color = _meshRenderer.material.GetColor(Color1);
                color.a = 0.8f;
                _meshRenderer.material.SetColor(Color1, color);

                // var sphere = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                // var sphereMesh = sphere.GetComponent<MeshFilter>().sharedMesh;
                // Destroy(sphere);
                
                // GetComponent<MeshFilter>().mesh = sphereMesh;
                // GetComponent<MeshCollider>().sharedMesh = sphereMesh;


                // Debug.Log($"Got a point, setting to {point.coordinates.longitude}, {point.coordinates.latitude}");
                
                // TODO: move to visuals or something???? and update instead of re-create, also, find a way to scale only the mesh
                // if (_featureObject.properties.ContainsKey("connected"))
                // {
                //     var scale = Convert.ToInt32(_featureObject.properties.GetValueOrDefault("connected", "5")) / 40f;
                //     _visualInstance.transform.localScale = new Vector3(scale, scale, scale);
                // }

                _markerPosition.scale = 15;
                _markerPosition.elevate = 1;
                _markerPosition.location = new Vector2d(point.coordinates.longitude, point.coordinates.latitude);
                _markerPosition.UpdatePosition();

                return;
            }

            // TODO: now only supports multiPolygon/Polygon
            // TODO: perhaps normalize the shape cords on the server and add the position as property
            if (_featureObject.geometry.type != "MultiPolygon" && _featureObject.geometry.type != "Polygon") return;
            
            var poly = _featureObject.geometry.type == "MultiPolygon" 
                ? ((MultiPolygonGeometryObject) _featureObject.geometry).polygons[0] 
                : (PolygonGeometryObject) _featureObject.geometry;

            var cords = poly.coordinates[0]
                .Map(o => o.ToVector2())//-400, -100))
                .ToArray();

            // TODO: need this? When each feature is normalize, need to take location from properties?
            if (_featureObject.properties.ContainsKey("location"))
            {
                var loc = _featureObject.properties.GetValue("location", "").Split(";");
                if (loc.Length == 2)
                {
                    _markerPosition.location = new Vector2d(double.Parse(loc[1]), double.Parse(loc[0]));
                }
            }
            
            var mesh = new GeoJsonMesh(cords).AddUvs().ConvertToExtruded(false).GetMesh();

            GetComponent<MeshFilter>().mesh = mesh;
            GetComponent<MeshCollider>().sharedMesh = mesh;
            
            _markerPosition.UpdatePosition();
        }

        public void UpdateFeatureObject(FeatureObject featureObject)
        {
            _featureObject = featureObject;
            
            if (_featureObject.geometry.type == "Point")
            {
                
                var point = (PointGeometryObject) _featureObject.geometry;
                if (_featureObject.properties.ContainsKey("connected") && _visualInstance)
                {
                    var scale = Convert.ToInt32(_featureObject.properties.GetValueOrDefault("connected", "5")) / 40f;
                    _visualInstance.transform.localScale = new Vector3(scale, scale, scale);
                }
                
                _markerPosition.location = new Vector2d(point.coordinates.longitude, point.coordinates.latitude);
                _markerPosition.UpdatePosition();
            }
        }

        public void SetVertices(Vector2[] vertices)
        {
            this._vertices = vertices;
            
            CreateMesh();
        }

        private void HeightUpdated()
        {
            // GetComponent<MarkerPosition>().UpdateHeight(Height);
            _markerPosition.UpdateHeight(Height);
        }

        public void UpdateColor(string color)
        {
            if (ColorUtility.TryParseHtmlString(color, out var colorObj))
            {
                if (_visibleActive && _prevColor != null)
                {
                    colorObj.a = ((Color) _prevColor).a;
                    _prevColor = colorObj;
                }
                else
                {
                    colorObj.a = _meshRenderer.material.GetColor(Color1).a;
                    _meshRenderer.material.SetColor(Color1, colorObj);
                    // _meshRenderer.material.SetColor(BaseMap, colorObj);
                }
                
            }
        }

        public void UpdateSize(JSONObject type)
        {
            var field = type.GetField("field").str;
            if (!_featureObject.properties.ContainsKey(field)) return;

            var typeDefault = type.GetField("default").f;
            var typeScale = type.GetField("scale").f;
            var typeAdd = type.HasField("add") ? type.GetField("add").f : 0;

            var scale = (Convert.ToInt32(_featureObject.properties.GetValueOrDefault(field, $"{typeDefault}")) * typeScale) + typeAdd;
            _visualInstance.transform.localScale = new Vector3(scale, scale, scale);
        }
    }
}