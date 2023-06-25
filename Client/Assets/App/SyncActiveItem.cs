using System;
using JetBrains.Annotations;
using TMPro;
using UnityEngine;
using Utils.GeoJSON;

namespace App
{
    public class SyncActiveItem : MonoBehaviour
    {
        private GeoJsonRenderer _activeItem;

        public string lastActiveItemName;

        private TextMeshProUGUI _text;

        public void SetItem(string activeItemName, [CanBeNull] GeoJsonRenderer activeItem, long userId, Canvas labelCanvas)
        {
            lastActiveItemName = activeItemName;
            
            _text.text = $"User {userId} viewing: {activeItemName}";

            _activeItem = activeItem;

            transform.SetParent(labelCanvas.transform, false);
        }

        private void Awake()
        {
            if (!gameObject.GetComponent<TextMeshProUGUI>())
            {
                gameObject.AddComponent<TextMeshProUGUI>();
            }

            _text = gameObject.GetComponent<TextMeshProUGUI>();
        }

        private void Update()
        {
            if (_activeItem == null) return;
            if (Camera.main == null) return;

            var position = _activeItem.transform.position;
            var offsetPos = new Vector3(position.x, position.y + 0.05f, position.z);
 
            // Vector2 screenPoint = Camera.main.WorldToScreenPoint(offsetPos);

            // Convert screen position to Canvas / RectTransform space <- leave camera null if Screen Space Overlay
            // RectTransformUtility.ScreenPointToLocalPointInRectangle(_labelCanvas.GetComponent<RectTransform>(), screenPoint, null, out var canvasPos);

            // _labelCanvas.GetComponent<RectTransform>().anchoredPosition = screenPoint;
            
            var o = gameObject;
            var camPos = Camera.main.transform.position;
            var labelScale = 0.1f + Vector3.Distance(o.transform.position, camPos) * 0.2f;
            
            o.transform.LookAt(camPos);
            o.transform.Rotate(o.transform.rotation.x,180, o.transform.rotation.z);
            o.transform.localScale = new Vector3(labelScale, labelScale, labelScale);
            o.transform.position = offsetPos;
        }
    }
}
