using System;
using Mapbox.Utils;
using UnityEngine;

namespace App.Dto.Client
{
    [Serializable]
    public class UpdateConfig
    {
        public string type = "updateConfig";
        public bool switchWifiData;
        public bool switchWifiLive;
    }
}