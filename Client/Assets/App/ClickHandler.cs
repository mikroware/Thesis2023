using UnityEngine;
using UnityEngine.UI;

namespace App
{
    public class ClickHandler : MonoBehaviour
    {
        private void OnEnable() {
            if (GetComponent<Button>() == null) {
                throw new MissingComponentException("Missing a Button component");
            }
        }
    
        private void Start()
        {
            var button = GetComponent<Button>();
        
            button.onClick.AddListener(delegate { Click(button.transition.ToString()); });
        
            Debug.Log("Listening to button " + button.transition + " on " + gameObject.name);
        }

        private void Click(string buttonName)
        {
            Debug.Log("ClickHandlerClicked! " + gameObject.name + " - " + buttonName);
        }
    }
}
