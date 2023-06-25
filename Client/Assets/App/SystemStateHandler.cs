using UnityEngine;
using UnityEngine.UI;

namespace App
{
    public class SystemStateHandler : MonoBehaviour
    {
        public GameObject panelState;
        public GameObject panelConnecting;

        private Text _textBox;
    
        private void Start()
        {
            if (panelState)
                _textBox = panelState.GetComponentInChildren<Text>();
        
            panelState.SetActive(false);
            panelConnecting.SetActive(false);
        
            Events.System.Subscribe(gameObject, data =>
            { 
                // No processing, so hide
                if (!data.GetField("processing").b)
                {
                    panelState.SetActive(false);
                    return;
                }
            
                // Not processing, so make sure it is visible
                panelState.SetActive(true);
            
                _textBox.text = $"Server is processing\n{data.GetField("currentTask").str}";
            });

            if (panelConnecting) 
                Events.InternalEvent.Subscribe(gameObject, data =>
                {
                    if (data.connecting == true || data.connected == false)
                    {
                        panelConnecting.SetActive(true);
                    }
                    else
                    {
                        panelConnecting.SetActive(false);
                    }
                });
        }
    }
}
