using System;
using Mapbox.Utils;
using UnityEngine;

namespace App.Dto.Client
{
    [Serializable]
    public class MapSync
    {
        public string type = "mapSync";
        public float zoom;
        public Vector2d pan;
    }
}