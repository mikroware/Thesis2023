using UnityEngine;

namespace App
{
    public class SystemStateManager : MonoBehaviour
    {
        public bool editingMode = false;
        
        public delegate void OnEditingModeClick(Vector3 position);
        public event OnEditingModeClick onEditingModeClick;

        public void SetEditingMode(OnEditingModeClick clickHandler)
        {
            editingMode = true;
            onEditingModeClick = null;
            onEditingModeClick += clickHandler;
        }

        public void DisableEditingMode()
        {
            editingMode = false;
            onEditingModeClick = null;
        }

        public void CallOnEditingModeClick(Vector3 position)
        {
            onEditingModeClick?.Invoke(position);
        }
    }
}
