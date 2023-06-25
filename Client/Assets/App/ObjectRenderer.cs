using System;
using System.Collections.Generic;
using System.Linq;
using com.csutil;
using Mapbox.Map;
using Mapbox.Unity.Map;
using Mapbox.Unity.Utilities;
using Mapbox.Utils;
using Unity.VisualScripting;
using UnityEngine;
using ColorUtility = UnityEngine.ColorUtility;

namespace App
{
    public class ObjectRenderer : MonoBehaviour
    {
        private const float RdNlScaleFactor = 1.6f;

        private MeshRenderer _meshRenderer;
        
        private JSONObject _obj;

        private AbstractMap _map;

        private static readonly int Color = Shader.PropertyToID("_BaseColor");

        private Vector2d _location;

        public void SetObj(JSONObject obj)
        {
            _obj = obj;
            CreateMesh();
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
            
            if (!_map)
            {
                _map = FindObjectOfType<AbstractMap>();
            }
            
            _map.OnUpdated += UpdatePosition;

            _meshRenderer = GetComponent<MeshRenderer>();
        }

        private void CreateMesh()
        {
            if (!GetComponent<MeshFilter>())
            {
                Debug.Log("No MeshFilter on " + name);
                return;
            }

            if (_obj == null)
            {
                Debug.Log("No featureObject on " + name);
                return;
            }

            transform.localPosition = new Vector3(0.03f, 0, -0.28f);

            var cords = _obj.GetField("geometry").list[0].GetField("boundaries").list;
            var verticesList = new List<Vector3>();
            var trianglesList = new List<int>();
            var normalsList = new List<Vector3>();

            var locationStr = _obj.GetField("location");
            if (!locationStr.IsString)
            {
                Debug.Log("No location on " + name);
                return;
            }
            
            var loc = locationStr.str.Split(";");
            if (loc.Length == 2)
            {
                _location = new Vector2d( double.Parse(loc[1]), double.Parse(loc[0]));
            }
            
            var c = cords[0].list[0][0][0]; // First triangle position, take as alignment point

            foreach (var item in cords[0].list)
            {
                var l = item[0].list.Select(pos => pos.list[2].f).ToList();
                var isRoof = l.All(f => Math.Abs(f - l[0]) < 0.001);

                var i = 0;
                foreach (var pos in item[0].list)
                {
                    verticesList.Add(new Vector3(
                        (pos.list[0].f - c[0].f), 
                        pos.list[2].f, 
                        (pos.list[1].f - c[1].f)
                    ));
                    
                    // Turning the triangle around to fix rendering
                    trianglesList.Add(trianglesList.Count + (i == 0 ? 0 : (i == 1 ? 1 : -1)));
                    
                    normalsList.Add(isRoof ? Vector3.up : Vector3.forward);

                    i++;
                }                
            }
            
            var solidMesh = new Mesh
            {
                vertices = verticesList.ToArray(),
                triangles = trianglesList.ToArray(),
                normals = normalsList.ToArray(),
            };

            GetComponent<MeshFilter>().mesh = solidMesh;
            GetComponent<MeshCollider>().sharedMesh = solidMesh;
            
            UpdateColor(cords[0].list.Count > 100 ? new Color(0.59f, 0.9f, 1f) : new Color(1f, 0.88f, 0.49f));
            UpdatePosition();
        }

        public void UpdatePosition()
        {
            // if (_location.) return; // Don't know how to check this for default/null
            
            var t = transform;
            var pos = _map.GeoToWorldPosition(_location, false);
            pos.y = 0;
            
            t.localPosition = pos;
            
            var mapScale = _map.WorldRelativeScale;
            // var extraScale = Mathf.Pow(RdNlScaleFactor, _map.Zoom % 1 == 0 ? 1 : 2);
            // TODO: It appears the RdNlScaleFactor I found might be the InitialZoom / 10?
            // TODO: But does not work for other initial zooms, or for 0.25 zoom increments, so current formula is still off 
            var extraScale = Mathf.Pow(_map.InitialZoom / 10f, _map.Zoom % 1 == 0 ? 1 : 2);

            // TODO: decide on final zooming behavior, Mapbox only changed the WorldRelativeScale on integer zoom values, rest is unity zoom
            // https://github.com/mapbox/mapbox-unity-sdk/issues/1374
            // RectD referenceTileRect = Conversions.TileBounds(TileCover.CoordinateToTileId(_map.CenterLatitudeLongitude, _map.AbsoluteZoom));
            // double differenceInZoom = _map.Zoom - _map.InitialZoom;
            // double unitsPerMeter = _map.Options.scalingOptions.unityTileSize / referenceTileRect.Size.x;
            // // double localScale = (double)_initialScale * (double)radiusMeters * 2d * unitsPerMeter * Mathd.Pow(2d, differenceInZoom);
            // Debug.Log($"map: {_map.WorldRelativeScale}, zooms: {_map.Zoom}, {differenceInZoom}, {Mathd.Pow(2d, differenceInZoom)}, {unitsPerMeter} - extraScale: {extraScale}");

            t.localScale = new Vector3(mapScale * extraScale, mapScale * 3, mapScale * extraScale);
        }

        public void UpdateColor(string color)
        {
            if (ColorUtility.TryParseHtmlString(color, out var colorObj))
            {
                _meshRenderer.material.SetColor(Color, colorObj);
            }
        }
        
        public void UpdateColor(Color color)
        {
            _meshRenderer.material.SetColor(Color, color);
        }
    }
}