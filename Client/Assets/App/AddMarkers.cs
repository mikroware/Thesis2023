using System.Collections.Generic;
using com.csutil;
using Mapbox.Unity.Map;
using Mapbox.Unity.Utilities;
using Mapbox.Utils;
using UnityEngine;

namespace App
{
    public class AddMarkers : MonoBehaviour
    {
        [SerializeField]
        AbstractMap map;

        [SerializeField]
        GameObject markerPrefab;

        Vector2d[] locations = { 
            Conversions.StringToLatLon("52.006095, 4.366882"),
            Conversions.StringToLatLon("51.997242, 4.3751"),
        };

        [SerializeField]
        float scale;

        List<GameObject> spawnedObjects;

        void Start()
        {
            scale = map.Zoom;// / 3;
            spawnedObjects = new List<GameObject>();
        
            // Not here as it keeps adding to the prefab..
            //markerPrefab.AddComponent<MarkerPosition>();

            foreach (Vector2d location in locations)
            {
                var instance = Instantiate(markerPrefab);

                instance.AddComponent<MarkerPosition>();
                instance.GetComponent<MarkerPosition>().location = location;
                instance.GetComponent<MarkerPosition>().scale = scale;
                instance.GetComponent<MarkerPosition>().map = map;

                spawnedObjects.Add(instance);
            }

            updateSpawnedObjects();

            // Testing
            map.OnMapRedrawn += testUpdate;
        
        
            // TODO: testing
            (EventBus.instance as EventBus).Subscribe<object>(this, "SOMETHING_CHANGED", (eventData) =>
            {
                Debug.Log("Yes got SOMETHING_CHANGED event, with data:");
                Debug.Log(eventData);
            });
        
            Events.Test.Subscribe(this, (eventData) =>
            {
                Debug.Log(eventData);
            });
        }

        void LateUpdate()
        {
            // Late the objects themselves update their location instead of here
            //updateSpawnedObjects();
        }

        private void updateSpawnedObjects()
        {
            foreach (GameObject instance in spawnedObjects)
            {   
                instance.transform.localPosition = map.GeoToWorldPosition(instance.GetComponent<MarkerPosition>().location, true);

                //Debug.Log(string.Format("Tilesize: {0}, scale: {1}, transform: {2}", map.UnityTileSize, map.WorldRelativeScale, map.transform.localScale.x));
                // InitialZoom
                var mapScale = scale * map.transform.localScale.x;
                instance.transform.localScale = new Vector3(mapScale, mapScale, mapScale);
            }
        }

        private void testUpdate()
        {
            Debug.Log("What is tis?");
        }
    }
}
