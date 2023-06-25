using UnityEngine;
using UnityEngine.XR;
using UnityEngine.XR.Management;

namespace App
{
    // TODO: change from MonoBehaviour to ScriptableObject (e.g. it runs at the beginning of the game, not scene)?
    public class DetectVR : MonoBehaviour
    {
        public GameObject xrOriginCharacter;
        public GameObject xrInteractionManager;
        public GameObject pancakeCharacter;

        public bool IsInitialized { get; private set;}
        
        private Camera _camera;
        private bool _isVr = false;

        private void Start()
        {
            var xrSettings = XRGeneralSettings.Instance;
            if (xrSettings == null)
            {
                Debug.Log("XRGeneralSettings is null, this should not happen.");
                return;
            }

            var xrManager = xrSettings.Manager;
            if (xrManager == null)
            {
                Debug.Log("XRManager is null, this should not happen.");
                return;
            }

            var xrLoader = xrManager.activeLoader;
            
            xrOriginCharacter.SetActive(xrLoader != null);
            xrInteractionManager.SetActive(xrLoader != null);
            pancakeCharacter.SetActive(xrLoader == null);
            
            if (xrLoader == null)
            {
                Debug.Log("Starting desktop mode");
                _camera = pancakeCharacter.GetComponentInChildren<Camera>();
            }
            else
            {
                Debug.Log($"Starting VR mode, device: {XRSettings.loadedDeviceName}");
                _camera = xrOriginCharacter.GetComponentInChildren<Camera>();
                _isVr = true;
            }

            IsInitialized = true;
        }

        public Camera GetCamera()
        {
            return _camera;
        }

        public bool IsVr()
        {
            return _isVr;
        }
    }
}
