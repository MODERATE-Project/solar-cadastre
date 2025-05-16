# Geoserver

## Connection with the PostGIS database

Once Geoserver is installed, we need to log in and go to Data -> Data Stores -> Add new store.

<img src="./geoserver/new-data-storage.PNG" alt="Geoserver connection" style="max-width:600px"/>

In the next step, we need to select the PostGIS option.

<img src="./geoserver/postgis-selection.PNG" alt="PostGIS selection" style="max-width:600px"/>

A form will appear where we need to enter the data source name and specify the connection parameters for the database. Once everything is set, we just need to click the Save button.

<img src="./geoserver/specify-parameters.PNG" alt="Specify parameters" style="max-width:600px"/>

When the store is created, it will automatically take us to the section where we can create/publish a new layer from this database. We just need to click on the layer we want to publish, and it will be published automatically.

<img src="./geoserver/publish-layer.PNG" alt="Publish layer" style="max-width:600px"/>

Once we select the layer, we will be taken to a form where we only need to change the Coordinate Reference System. The declared SRS should be changed to EPSG:4326, and then we need to click "Compute from data" in the "Native Bounding Box" section, followed by clicking "Compute from native bounding box" in the "Lat/Lon Bounding Box" section.

<img src="./geoserver/reference-system.PNG" alt="Reference system" style="max-width:600px"/>

Finally, we need to go to "Layer Preview" in the application, search for the published layer, and select the "OpenLayers" option to see how the layer is displayed.

<img src="./geoserver/select-layer.PNG" alt="Select layer" style="max-width:600px"/>

If everything was done correctly, the layer should be displayed without any issues.

<img src="./geoserver/view-layer.PNG" alt="View layer" style="max-width:600px"/>

## Create a raster layer

In order to create a raster layer, first of all, we need to have a file with a .tif extension.

Once we have that file, we need to upload it to the server, specifically in the Geoserver directory, otherwise the program will not be able to make it available.

<img src="./geoserver/raster-layer.PNG" alt="File location" style="max-width:600px"/>

Inside Geoserver, we have to go to the Stores section and select "Add new Store".

<img src="./geoserver/create-raster-store.PNG" alt="Raster store" style="max-width:600px"/>

The next step is to name the data store, select the workspace and select the TIF file.

<img src="./geoserver/store-name-file.PNG" alt="Store name" style="max-width:600px"/>

<img src="./geoserver/file-selection.PNG" alt="File selection" style="max-width:600px"/>

It will automatically ask us to publish the layer. We can do it by clicking on the Publish option.

<img src="./geoserver/publish-raster-layer.PNG" alt="Publish raster layer" style="max-width:600px"/>

Once we do that, the only thing we need to do is click on the Save button. If everything is fine, we can see the layer in the Layer Preview section.

<img src="./geoserver/view-raster-layer-1.PNG" alt="View raster layer" style="max-width:600px"/>

This is the result you should see.

<img src="./geoserver/raster-layer-result.PNG" alt="View raster layer" style="max-width:600px"/>