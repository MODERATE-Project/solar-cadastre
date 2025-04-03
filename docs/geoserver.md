# Geoserver

## Connection with the PostGIS database

Once Geoserver is installed, we need to log in and go to Data -> Data Stores -> Add new store.

<img src="geoserver/new-data-storage.PNG" alt="First step with Geoserver" width="800">

In the next step, we need to select the PostGIS option.

<img src="geoserver/postgis-selection.PNG" alt="PostGIS selection" width="800">

A form will appear where we need to enter the data source name and then specify the connection parameters with the database. Once everything is set, we just need to click the Save button.

<img src="geoserver/specify-parameters.PNG" alt="Specify parameters" width="800">

When the store is created, it will automatically take us to the section where we can create/publish a new layer from this database. We just need to click on the layer we want to publish, and it will be published automatically.

<img src="geoserver/publish-layer.PNG" alt="Publish layer" width="800">

Once we select the layer, we will be taken to a form where we only need to change the Coordinate Reference System. The declared SRS should be changed to EPSG:4326, and then we need to click "Compute from data" in the "Native Bounding Box" section, followed by clicking "Compute from native bounding box" in the "Lat/Lon Bounding Box" section.

<img src="geoserver/reference-system.PNG" alt="Reference system" width="800">

Finally, we need to go to "Layer Preview" in the application, search for the published layer, and select the "OpenLayers" option to see how the layer is displayed.

<img src="geoserver/select-layer.PNG" alt="Select layer" width="800">

If everything was done correctly, the layer should be displayed without any issues.

<img src="geoserver/view-layer.PNG" alt="View layer" width="800">
