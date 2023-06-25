using UnityEngine;

namespace App.Data
{
    public class LayerManager : MonoBehaviour
    {

        public void DataUpdateFromServer(JSONObject json)
        {
            Debug.Log("Got layer update");
            // Update the local data about the layers
            // If necessary, render de data on the layers (probably here need to fetch)
            // If necessary update encodings
        }
    }
}
