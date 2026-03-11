mapboxgl.accessToken = ''; // Add Mapbox access token

const map = new mapboxgl.Map({
    container: 'my-map',
    style: 'mapbox://styles/mapbox/standard',
    config: {
        basemap: {
            theme: "standard"
        }
    },
    center: [-156.3, 20.8], // Rough coordinates for the Hawaii (can change later)
    zoom: 10,
    minZoom: 4 // Furthest out that the map can zoom to ensure the target area is visible
});

/*--------------------------------------------------------------------
MAP CONTROLS
--------------------------------------------------------------------*/
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.FullscreenControl());

// Load the map
map.on('load', () => {

    // 1. ADD DATA SOURCES
    // Add a data source containing GeoJSON data
    map.addSource('INSERTMAPIDHERE', {
        'type': 'geojson',
        'data': '' // Add dolphins point data source path
    });
    // 2. VISUALIZE DATA LAYERS
    map.addLayer({
        'id': 'INSERTMAPIDHERE',
        'type': 'circle', // Choose the symbol to be a circle
        'source': 'INSERTDATASOURCEHERE', // Get data from the dolphins data source
        'paint': {
            'circle-radius': 5, // Set radius of dolphin points
            'circle-color': [
                'match',
                ['get', 'species'], // Set colour of dolphin points based on their species (colour is tentative)
                "1", '#fd3c3c',   // red for bottlenose dolphin
                "2", '#fc972a',   // orange for rough toothed dolphin
                "3", '#e3e01a',   // yellow for pantropical spotted dolphin
                "4", '#adbd00',   // light green for spinner dolphin
                "5", '#008015',    // dark green for rissos dolphin
                "6", '#55e0f9',    // light blue for striped dolphin
                "7", '#5589f9',    // dark blue for fraser dolphin
                '#ee55f9'    // purple as a fallback colour if none match..?
            ]
        }
    });

});
/*--------------------------------------------------------------------
CREATE LEGEND IN JAVASCRIPT
--------------------------------------------------------------------*/
// Declare array variables for labels and colours (ALL COLOURS ARE TENTATIVE)
const legenditems = [
    { label: 'Bottlenose Dolphin', colour: '#fd3c3c' }, // red for bottlenose dolphin
    { label: 'Rough Toothed Dolphin', colour: '#fc972a' }, // orange for rough toothed dolphin
    { label: 'Pantropical Spotted Dolphin', colour: '#e3e01a' }, // yellow for pantropical spotted dolphin
    { label: 'Spinner Dolphin', colour: '#adbd00' }, // light green for spinner dolphin
    { label: 'Rissos Dolphin', colour: '#008015' }, // dark green for rissos dolphin
    { label: 'Striped Dolphin', colour: '#55e0f9' }, // light blue for striped dolphin
    { label: 'Fraser Dolphin', colour: '#5589f9' } // dark blue for fraser dolphin
];

// For each array item create a row to put the label and colour in
legenditems.forEach(({ label, colour }) => {
    const row = document.createElement('div'); // each item gets a 'row' as a div - this isn't in the legend yet, we do this later
    const colcircle = document.createElement('span'); // create span for colour circle

    colcircle.className = 'legend-colcircle'; // the colcircle will take on the shape and style properties defined in css
    colcircle.style.setProperty('--legendcolour', colour); // a custom property is used to take the colour from the array and apply it to the css class

    const text = document.createElement('span'); // create span for label text
    text.textContent = label; // set text variable to tlegend label value in array

    row.append(colcircle, text); // add circle and text to legend row
    legend.appendChild(row); // add row to legend container
});

/*--------------------------------------------------------------------
ADD INTERACTIVITY BASED ON HTML EVENT
--------------------------------------------------------------------*/

// 1) Add event listener which returns map view to full screen on button click using flyTo method
document.getElementById('returnbutton').addEventListener('click', () => { // Button that is triggered by a click
    map.flyTo({
        center: [-156.3, 20.8], // Clicking the button moves to these starting coordinates
        zoom: 10, // Clicking the button returns the zoom to 10
        essential: true
    });
});


// 2) Change display of legend based on check box
let legendcheck = document.getElementById('legendcheck'); // Create variable for a button that can be checked

legendcheck.addEventListener('click', () => { // Button that is triggered by a click
    if (legendcheck.checked) {
        legendcheck.checked = true; // Check if the legendcheck variable is true
        legend.style.display = 'block'; // If the legendcheck variable is true, hide the legend
    }
    else {
        legend.style.display = "none"; // Reveal the legend
        legendcheck.checked = false;
    }
});


// 3) Change map layer display of dolphins based on check box using setLayoutProperty method
document.getElementById('layercheck').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'INSERTMAPIDHERE',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

// 4) Filter data layer to show selected species of dolphins from dropdown selection
let speciestype;

document.getElementById("Species").addEventListener('change',(e) => {
    speciestype = document.getElementById('Species').value;

    //console.log(boundaryvalue); // Useful for testing whether correct values are returned from dropdown selection

    if (speciestype == 'All') {
        map.setFilter(
            'INSERTMAPIDHERE',
            null // Resets the filter to show all dolphins
        );
    } else {
        map.setFilter(
            'INSERTMAPIDHERE',
            ['==', ['get', 'species'], speciestype] // Shows only selected species of dolphins
        );
    }

});