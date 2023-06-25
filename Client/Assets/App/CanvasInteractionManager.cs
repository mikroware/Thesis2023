using System;
using Mapbox.Unity.Map;
using UnityEngine;

namespace App
{
    public class CanvasInteractionManager : MonoBehaviour
    {
        private AbstractMap _map;
        private DataManager _dataManager;
        
        private void Start()
        {
            _map = FindObjectOfType<AbstractMap>();
            _dataManager = FindObjectOfType<DataManager>();
        }

        public void ZoomInButton()
        {
            _map.SetZoom(_map.Zoom + 0.5f);
            _map.UpdateMap();
        }
        
        public void ZoomOutButton()
        {
            _map.SetZoom(_map.Zoom - 0.5f);
            _map.UpdateMap();
        }

        public void SwitchWifiData()
        {
            _dataManager.SocketSendToServer(new Dto.Client.UpdateConfig
            {
                switchWifiData = true,
            });
        }
        
        public void SwitchWifiLive()
        {
            _dataManager.SocketSendToServer(new Dto.Client.UpdateConfig
            {
                switchWifiLive = true,
            });
        }
    }
}
