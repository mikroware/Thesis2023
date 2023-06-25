using System;
using Mapbox.Unity.Map;
using Mapbox.Utils;
using UnityEngine;

namespace App
{
    public class MarkerPosition : MonoBehaviour
    {
        public Vector2d location;
        public float scale;
        public AbstractMap map;

        private int _elevate;
    
        [SerializeField]
        private float height = 1f;

        private float _timer;
        private Vector3 _fromScale;

        public bool lerpIt = false;
    
        public static MarkerPosition AddComponent(GameObject where, int elevate = 0, float height = 1.0f)
        {
            var component = where.AddComponent<MarkerPosition>();
        
            component._elevate = elevate;
            component.height = height;

            return component;
        }

        private void Start()
        {
            if (!map)
            {
                // map = GameObject.Find("/Environment/Map")?.GetComponent<AbstractMap>();
            }
        
            _fromScale = transform.localScale;
        }

        private void LateUpdate()
        {
            // TODO: adjust to new map?
            // UpdatePosition();
        }

        private void UpdatePosition()
        {
            // TODO: perhaps do this only when the map is OnUpdated
            var pos = map.GeoToWorldPosition(location, false);
            pos.y += _elevate;
            transform.localPosition = pos;

            var localScale = map.transform.localScale;
            var mapScale = scale * localScale.x;
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
                transform.localScale = new Vector3(mapScale, mapScale * height, mapScale);
            }
        }

        public void UpdateHeight(float newHeight)
        {
            height = newHeight;
        }
    }
}
