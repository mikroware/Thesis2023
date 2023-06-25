using System.Collections.Generic;
using com.csutil;
using Mapbox.Map;
using UnityEngine;

// ReSharper disable once CheckNamespace
namespace Mapbox.Unity.Map.TileProviders
{
	public class CustomTileProvider : AbstractTileProvider
	{
		[SerializeField] private RangeAroundTransformTileProviderOptions _rangeTileProviderOptions;

		private bool _initialized = false;
		private UnwrappedTileId _currentTile;
		private bool _waitingForTargetTransform = false;

		private Camera _camera;

		public override void OnInitialized()
		{
			_camera = Camera.main;
			
			if (Options != null)
			{
				_rangeTileProviderOptions = (RangeAroundTransformTileProviderOptions)Options;
			}
			else if (_rangeTileProviderOptions == null)
			{
				_rangeTileProviderOptions = new RangeAroundTransformTileProviderOptions();
			}

			if (_rangeTileProviderOptions.targetTransform == null)
			{
				Debug.LogError("TransformTileProvider: No location marker transform specified.");
				_waitingForTargetTransform = true;
			}
			else
			{
				_initialized = true;
			}
			_currentExtent.activeTiles = new HashSet<UnwrappedTileId>();
			_map.OnInitialized += UpdateTileExtent;
			_map.OnUpdated += UpdateTileExtent;
		}

		public override void UpdateTileExtent()
		{
			if (!_initialized) return;

			var pos = _rangeTileProviderOptions.targetTransform.localPosition;
			
			// Find where the camera is looking at, load those tiles
			var camPosNormal = pos.SetY(0);
			var plane = new Plane(Vector3.up, Vector3.zero);
			var ray = _camera.ScreenPointToRay(new Vector3(Screen.width / 2f, Screen.height / 2f, 0));

			if (plane.Raycast(ray, out var entry))
			{
				pos = ray.GetPoint(entry);
				// Debug.Log($"Got ray pos: {pos.ToString()}, camera pos: {camPosNormal.ToString()}");

				var maxDistance = Mathf.Pow(2, 21 - _map.AbsoluteZoom + 6);
				
				pos = camPosNormal + Vector3.ClampMagnitude(pos - camPosNormal, maxDistance);
				// Debug.Log($"Clamping to: {pos.ToString()}, max distance: {maxDistance}");
			}
			
			// Get the new tile and check if anything changed
			var newTile = TileCover.CoordinateToTileId(_map.WorldToGeoPosition(pos), _map.AbsoluteZoom);
			if (_currentTile.Equals(newTile)) return;

			_currentExtent.activeTiles.Clear();
			_currentTile = newTile;
			
			for (int x = _currentTile.X - _rangeTileProviderOptions.visibleBuffer; x <= (_currentTile.X + _rangeTileProviderOptions.visibleBuffer); x++)
			{
				for (int y = _currentTile.Y - _rangeTileProviderOptions.visibleBuffer; y <= (_currentTile.Y + _rangeTileProviderOptions.visibleBuffer); y++)
				{
					_currentExtent.activeTiles.Add(new UnwrappedTileId(_map.AbsoluteZoom, x, y));
				}
			}
			OnExtentChanged();
		}

		public override void UpdateTileProvider()
		{
			if (_waitingForTargetTransform && !_initialized)
			{
				if (_rangeTileProviderOptions.targetTransform != null)
				{
					_initialized = true;
				}
			}

			if (_rangeTileProviderOptions != null && _rangeTileProviderOptions.targetTransform != null && _rangeTileProviderOptions.targetTransform.hasChanged)
			{
				UpdateTileExtent();
				_rangeTileProviderOptions.targetTransform.hasChanged = false;
			}
		}

		public override bool Cleanup(UnwrappedTileId tile)
		{
			bool dispose = false;
			dispose = tile.X > _currentTile.X + _rangeTileProviderOptions.disposeBuffer || tile.X < _currentTile.X - _rangeTileProviderOptions.disposeBuffer;
			dispose = dispose || tile.Y > _currentTile.Y + _rangeTileProviderOptions.disposeBuffer || tile.Y < _currentTile.Y - _rangeTileProviderOptions.disposeBuffer;


			return (dispose);
		}
	}
}