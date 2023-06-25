using System.Collections;
using com.csutil;
using JetBrains.Annotations;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using Utils.GeoJSON;

namespace App.Viewer
{
    public class ClickMesh : MonoBehaviour
    {
        public RectTransform canvas;
        public TextMeshProUGUI canvasContent;

        public DataManager dataManager;

        public DetectVR detectVR;

        private Vector3? lastClickPosition;

        private GeoJsonRenderer _lastActive;
        private string _lastActiveName;
        
        private Camera _camera;
    
        private int _fingerId = -1;

        private bool _shortDisableEdit = false;
    
        private void Awake()
        {
#if !UNITY_EDITOR
     _fingerId = 0; 
#endif
        }

        private IEnumerator Start()
        {
            yield return new WaitUntil(() => detectVR.IsInitialized);
            
            _camera = detectVR.GetCamera();

            if (canvas)
            {
                canvas.gameObject.SetActive(false);
                // canvas.GetRootCanvas().worldCamera = _camera;
            }
        }

        private void Update()
        {
            if (!_camera) return;
            if (detectVR.IsVr()) return;
            
            // If UI was hit, we want to abort all actions for now
            if (EventSystem.current.IsPointerOverGameObject(_fingerId))
            {
                return;
            }
        
            // if (Input.GetMouseButtonDown(0))
            // {
            var ray = _camera.ScreenPointToRay(Input.mousePosition);
            const int mapLayerMask = 1 << 8;
            const int uiLayerMask = 1 << 5;

            // In editing mode, perform a different raycast and ignore the rest
            if (dataManager && dataManager.systemState.editingMode)
            {
                // Only if there is a click, raycast the map
                if (!_shortDisableEdit && Input.GetMouseButtonDown(0) && Physics.Raycast(ray, out var mapHit, 5, mapLayerMask))
                {
                    dataManager.systemState.CallOnEditingModeClick(mapHit.point);
                    StartCoroutine(nameof(ShortDisableEdit));
                }
                
                // Ignore the rest regardless
                return;
            }

            if (Physics.Raycast(ray, out var hit, 5, ~(mapLayerMask | uiLayerMask)))
            {
                // Debug.Log("Mouse Down Hit the following object: " + hit.collider.name + ", gameObject: " + hit.collider.gameObject.name);

                if (dataManager)
                {
                    var hitName = hit.collider.name;
                    var visParent = hit.collider.GetComponent<VisualObjectParent>();
                    
                    if (visParent != null)
                    {
                        hitName = visParent.parentName;
                    }
                    
                    var geoJson = dataManager.GetById(hitName);

                    // Only update if not the same
                    if (_lastActive != geoJson)
                    {
                        if(_lastActive)
                            _lastActive.VisibleActive = false;

                        if (geoJson != null)
                        {
                            _lastActive = geoJson;
                            _lastActive.VisibleActive = true;
                            _lastActiveName = hitName;

                            // Debug.Log($"Ray hit a new object: {hitName}");
                        }
                        else
                        {
                            _lastActive = null;
                            _lastActiveName = null;
                        }
                    }
                    else
                    {
                        // Not a suitable object
                        if (!geoJson && _lastActive)
                        {
                            _lastActive.VisibleActive = false;
                            _lastActive = null;
                            _lastActiveName = null;
                        }

                        if (!geoJson)
                        {
                            // Debug.Log($"Ray hit no suitable object: {hitName}");
                        }
                    }
                }

                // There was a hit and there is still one active, and it is clicked
                if (Input.GetMouseButtonDown(0) && _lastActive && canvas)
                {
                    var center = hit.point;// hit.collider.GetComponent<Renderer>().bounds.center;
                    
                    EnableCanvas(_lastActive, center);
                    
                    canvas.position = center;

                    var p = _camera.transform.position;
                    var v = p - canvas.position;
                    v.x = v.z = 0.0f;
                    // v.z = 0.0f;
                    canvas.LookAt(p); 
                    // canvas.Rotate(0,180,0);
                    canvas.Rotate(canvas.rotation.x,180,0);

                    // var distanceToMain = Vector3.Distance(p, center);
                    // var scale = distanceToMain * Mathf.Tan(Mathf.Deg2Rad * (_camera.fieldOfView * 0.5f));
                    // canvas.localScale = new Vector3(scale, scale, scale);
                    canvas.localScale = new Vector3(0.5f, 0.5f, 0.5f);
                }

                // if (canvas)
                // {
                //     Debug.Log(hit.collider.gameObject.transform.localPosition);
                //
                //     var center = hit.collider.GetComponent<Renderer>().bounds.center;
                //     Debug.Log(center);
                //
                //     canvas.position = center;//hit.collider.gameObject.transform.localPosition;
                //     lastClickPosition = center;// hit.collider.gameObject.transform;
                // }
            }
            else
            {
                // There was NO hit but a click and a visible canvas -> disable
                if (Input.GetMouseButtonDown(0) && canvas && canvas.gameObject.activeSelf)
                {
                    canvas.gameObject.SetActive(false);
                }

                if (_lastActive)
                {
                    _lastActive.VisibleActive = false;
                    _lastActive = null;
                    _lastActiveName = null;
                }
                // Debug.Log("Nothing was hit!");
            }
            // }
        }

        public void EnableCanvas(GeoJsonRenderer geo, Vector3 clickPos)
        {
            canvas.gameObject.SetActive(true);
            canvasContent.text = string.Join("\n", geo.GetFeatureProperties().Map(pair => 
                $"{pair.Key}: {pair.Value}"
            ));
            
            lastClickPosition = clickPos;
        }

        public void DisableCanvas()
        {
            canvas.gameObject.SetActive(false);            
        }

        void LateUpdate()
        {
            if (canvas && lastClickPosition.HasValue && canvas.gameObject.activeSelf)
            {
                var pos = (Vector3) lastClickPosition;
                canvas.position = new Vector3(pos.x, pos.y + 0.1f, pos.z);

                // This has a wrong rotation it seems
                // var rotation = _camera.transform.rotation;
                // canvas.LookAt(transform.position + rotation * Vector3.forward, rotation * Vector3.up);
            
                // Looks like this really puts it in the users world
                var p = _camera.transform.position;
                // var v = p - canvas.position;
                // v.x = v.z = 0.0f;
                // canvas.LookAt(p - v);
                canvas.LookAt(p); // This makes it really look at the canvas, the other does not take x
                canvas.Rotate(canvas.rotation.x,180,0);

                // This is flat
                // canvas.rotation = _camera.transform.rotation;
            
                // var distanceToMain = Vector3.Distance(p, canvas.position);
                // var scale = distanceToMain * Mathf.Tan(Mathf.Deg2Rad * (_camera.fieldOfView * 0.5f));
                // canvas.localScale = new Vector3(scale, scale, scale);
                canvas.localScale = new Vector3(0.5f, 0.5f, 0.5f);
            }
        }
    
        private IEnumerator ShortDisableEdit ()
        {
            _shortDisableEdit = true;
            yield return new WaitForSeconds(0.3f);
            _shortDisableEdit = false;
        }

        public void RandomClickHandler()
        {
            Debug.Log("It was clicked!!");
        }

        public string GetLastActiveName()
        {
            return _lastActiveName;
        }

        public void SetLastActive([CanBeNull] GeoJsonRenderer geo, [CanBeNull] string activeName)
        {
            _lastActive = geo;
            _lastActiveName = activeName;
        }
    }
}
