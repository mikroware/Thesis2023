using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace GeoJSON {

	public class GeoJSONObject {

		public string type;

		public GeoJSONObject() {
		}

		public GeoJSONObject(JSONObject jsonObject) {
			if(jsonObject != null)
				type = jsonObject ["type"].str;
		}

		//Will always return a FeatureCollection...
		public static FeatureCollection Deserialize(string encodedString) {
			FeatureCollection collection;
			var jsonObject = new JSONObject(encodedString);
			
			// If this is an array, assume it is a collection of features
			if (jsonObject.IsArray)
			{
				collection = new FeatureCollection();
				foreach (var featureObject in jsonObject.list) {
					collection.features.Add (new FeatureObject(featureObject));
				}
				
				return collection;
			}
			
			
			if (jsonObject["type"].str == "FeatureCollection") {
				collection = new FeatureCollection(jsonObject);
			} else {
				collection = new FeatureCollection();
				collection.features.Add(new GeoJSON.FeatureObject(jsonObject));
			}

			return collection;
		}

		public virtual JSONObject Serialize () {

			JSONObject rootObject = new JSONObject (JSONObject.Type.OBJECT);
			rootObject.AddField ("type", type);

			SerializeContent (rootObject);

			return rootObject;
		}

		protected virtual void SerializeContent(JSONObject rootObject) {}
	}
}