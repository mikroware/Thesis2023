using Mapbox.Unity.Map;
using UnityEngine;

namespace App
{
    public class MapManager : MonoBehaviour
    {
        public bool keyboardMapControls = true;

        private DataManager _dataManager;
        private AbstractMap _map;

        private void Start()
        {
            _dataManager = FindObjectOfType<DataManager>();
            _map = FindObjectOfType<AbstractMap>();
            
            _dataManager.OnSocketEventType("config", (data) =>
            {
                if (!data.HasField("config")) return;
                
                var config = data.GetField("config");
                
                if (config["application"].GetField(out var map, "map", false))
                {
                    // TODO: does not work in MapBox URP version
                    // if (map && _map.ImageLayer.LayerSource == ImagerySourceType.None)
                    // {
                    //     _map.ImageLayer.SetLayerSource(ImagerySourceType.MapboxStreets);
                    // }
                    //
                    // if (!map && _map.ImageLayer.LayerSource != ImagerySourceType.None)
                    // {
                    //     _map.ImageLayer.SetLayerSource(null);
                    // }
                }
            });
        }

        private void Update()
        {
            if(keyboardMapControls) HandleKeyboardMapControl();
        }

        private void HandleKeyboardMapControl()
        {
            if (!Input.GetKeyDown(KeyCode.PageUp) && !Input.GetKeyDown(KeyCode.PageDown))
            {
                if (Input.GetKeyDown(KeyCode.Alpha0))
                {
                    FindObjectOfType<CanvasInteractionManager>().SwitchWifiData();
                }

                return;
            };

            var isUp = Input.GetKeyDown(KeyCode.PageUp);
            
            _map.SetZoom(_map.Zoom + (isUp ? 0.5f : -0.5f));
            _map.UpdateMap();
        }
    }
}
