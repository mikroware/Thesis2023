using System;
using Mapbox.Unity.Map;
using Mapbox.Utils;
using UnityEngine;
using UnityEngine.Serialization;

namespace Utils.GeoJSON
{
    public class MarkerPosition : MonoBehaviour
    {
        private const float RdNlScaleFactor = 1.6f;

        public Vector2d location;
        public float scale = 1f;
        public AbstractMap map;

        public float elevate;
    
        [SerializeField]
        private float height = 1f;

        private float _timer;
        private Vector3 _fromScale;

        public bool lerpIt = false;
    
        public static MarkerPosition AddComponent(GameObject where, float elevate = 0f, float height = 1.0f)
        {
            var component = where.AddComponent<MarkerPosition>();
        
            component.elevate = elevate;
            component.height = height;

            return component;
        }

        private void Awake()
        {
            if (!map)
            {
                map = FindObjectOfType<AbstractMap>();
            }

            map.OnUpdated += UpdatePosition;
        
            _fromScale = transform.localScale;
        }

        private void LateUpdate()
        {
            // TODO: temp disable updating to check performance (and it is not needed now that the map is static)
            // UpdatePosition();
        }

        public void UpdatePosition()
        {
            var mapScale = scale * map.WorldRelativeScale;
            var extraScale = Mathf.Pow(map.InitialZoom / 10f, map.Zoom % 1 == 0 ? 1 : 2);
            
            // TODO: perhaps do this only when the map is OnUpdated
            // Debug.Log($"location: {location.ToString()}");
            // -69500 -18390
            // var pos = new Vector3(69 * 0.5f, 0, 18 * 0.5f); // STATIC TEST
            var pos = map.GeoToWorldPosition(location, false);
            pos.y = 0 + (elevate * mapScale * extraScale);
            transform.localPosition = pos;

            // var localScale = transform.localScale; // STATIC TEST
            // var mapScale = 0.001f * 0.5f; // STATIC TEST
            // var localScale = map.transform.localScale;
            // var mapScale = scale * localScale.x;

            var currentHeight = transform.localScale.y;

            if (lerpIt)
            {
                if (Math.Abs(currentHeight - (mapScale * height)) > 0.1f)
                {
                    transform.localScale = Vector3.Lerp(_fromScale, new Vector3(mapScale, mapScale * height, mapScale), _timer / 3);
                    _timer += Time.deltaTime;
                }
                else
                {
                    // Keep it changing height for now
                    if (height > 39)
                    {
                        height = 20;
                        _timer = 0;
                        _fromScale = transform.localScale;
                    }
                    else if (height < 21)
                    {
                        height = 40;
                        _timer = 0;
                        _fromScale = transform.localScale;
                    }
                }
            }
            else
            {
                transform.localScale = new Vector3(mapScale * extraScale, mapScale * height, mapScale * extraScale);
                // transform.localScale = new Vector3(mapScale * RdNlScaleFactor, mapScale * height, mapScale * RdNlScaleFactor);
            }
        }

        public void UpdateHeight(float newHeight)
        {
            height = newHeight;
            UpdatePosition();
        }
    }
}
