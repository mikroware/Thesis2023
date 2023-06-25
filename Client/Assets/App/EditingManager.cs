using System.Net;
using Mapbox.Unity.Map;
using UnityEngine;
using UnityEngine.UI;

namespace App
{
    public class EditingManager : MonoBehaviour
    {
        public Button enableButton;
        public DataManager dataManager;

        private AbstractMap _map;
        
        private void Start()
        {
            enableButton.onClick.AddListener(ClickEnableButton);
            
            _map = FindObjectOfType<AbstractMap>();
        }

        private void ClickEnableButton()
        {
            if (!dataManager.systemState.editingMode)
            {
                dataManager.systemState.SetEditingMode(OnEditingMapClick);
                enableButton.GetComponentInChildren<Text>().text = "Editing ENABLED";
            }
            else
            {
                dataManager.systemState.DisableEditingMode();
                enableButton.GetComponentInChildren<Text>().text = "Editing mode";
            }
        }

        private async void OnEditingMapClick(Vector3 position)
        {
            var geo = _map.WorldToGeoPosition(position);
            
            Debug.Log($"Some position: {position.ToString()}, in real: {geo.ToString()}");

            var res = await dataManager.PostToServer("editing/add", new
            {
                layerIndex = 1,
                position = geo.ToArray(),
            });

            Debug.Log(res.HasField("error") 
                ? $"Error: {res["error"].str}" 
                : $"Success: {res["success"].b}"
            );
        }
    }
}
