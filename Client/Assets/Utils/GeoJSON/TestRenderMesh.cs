using Mapbox.Unity.Map;
using Mapbox.Unity.Utilities;
using Mapbox.Utils;
using UnityEngine;

namespace Utils.GeoJSON
{
    public class TestRenderMesh : MonoBehaviour
    {
        public float height = 20.0f;
    
        private readonly Vector2d _location = Conversions.StringToLatLon("52.001095, 4.364982");
    
        private void MapUpdated()
        {
            Debug.Log("Yo map is updated");
        }

        private void Start()
        {
            var pos = MarkerPosition.AddComponent(gameObject, 1, height);
            pos.lerpIt = true;
            pos.location = _location;
            pos.scale = 0.5f;
            pos.map = GameObject.Find("/Map").GetComponent<AbstractMap>();

            pos.map.OnUpdated += MapUpdated;

            new GeoJsonMesh(new[] {
                new Vector2(0,0),
                new Vector2(0,50),
                new Vector2(50,50),
                new Vector2(50,100),
                new Vector2(0,100),
                new Vector2(0,150),
                new Vector2(150,150),
                new Vector2(150,100),
                new Vector2(100,100),
                new Vector2(100,50),
                new Vector2(150,50),
                new Vector2(150,0),
            })
                .AddUvs()
                .ConvertToExtruded()
                .AddBasicRenderer(gameObject);
        }
    }
}
