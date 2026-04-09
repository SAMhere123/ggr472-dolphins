mapboxgl.accessToken = 'pk.eyJ1IjoiY2hlbmphbmEiLCJhIjoiY21rNGdpc3BoMDdiNzNlb3Yxbm02dGpwOCJ9.xYpWe_CkRr_Oe_Q-DtaVYw'; // *** Add Mapbox access token ***

//Initialize map
const map = new mapboxgl.Map({
    container: 'map',   // container id in HTML
    style: 'mapbox://styles/mapbox/standard',   //***Add map style here ***
    config: {
        basemap: {
            theme: "standard"
        }
    },
    center: [-156.3, 20.8], // Rough coordinates for the Hawaii (can change later)
    zoom: 6,   // starting point, longitude, latitude
    minZoom: 2 // Furthest out that the map can zoom to ensure the target area is visible
});

/*--------------------------------------------------------------------
MAP CONTROLS: zoom, rotation, and fullscreen
--------------------------------------------------------------------*/
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.FullscreenControl());

const popup = new mapboxgl.Popup({ // Add popup const
    closeButton: true,
    closeOnClick: true
});
/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/

// Load the map
map.on('load', () => {

    // 1. ADD DATA SOURCES
    // Add a data source containing GeoJSON data
    map.addSource('dolphins', {
        'type': 'geojson',
        'data': 'https://raw.githubusercontent.com/SAMhere123/ggr472-dolphins/main/Data/hi_pacioos_all_dolphins.geojson' // Add dolphins point data source path
    });
    // 2. VISUALIZE DATA LAYERS
    map.addLayer({
        'id': 'dolphins-pnt',
        'type': 'circle', // Choose the symbol to be a circle
        'source': 'dolphins', // Get data from the dolphins data source
        'paint': {
            'circle-radius': [ // set dolphin circle radius 
                'interpolate',
                ['linear'],
                ['get', 'num_seen'],  // set radius by num_seen attribute
                1, 2,    // when num_seen = 1, radius = 2
                10, 4,   // when num_seen = 10, radius = 4
                50, 10,  // when num_seen = 50, radius = 10
                100, 15  // when num_seen = 100, radius = 15
            ],
            'circle-color': [
                'match',
                ['get', 'species'], // Set colour of dolphin points based on their species (colour is tentative)
                "bottlenose dolphin", '#fd3c3c',   // red for bottlenose dolphin
                "rough-toothed dolphin", '#fc972a',   // orange for rough toothed dolphin
                "pantropical spotted dolphin", '#e3e01a',   // yellow for pantropical spotted dolphin
                "spinner dolphin", '#adbd00',   // light green for spinner dolphin
                "Rissos dolphin", '#008015',    // dark green for rissos dolphin
                "striped dolphin", '#55e0f9',    // light blue for striped dolphin
                "Frasers dolphin", '#5589f9',    // dark blue for frasers dolphin
                '#ee55f9'    // purple as a fallback colour if none match..?
            ]
        }
    });
    // CREATE DOLPHINS SPECIES FILTER
    const dropdown = document.getElementById('species-select');
    dropdown.addEventListener('change', () => { // check for dropdown box selection
        const selected = dropdown.value;

        if (selected == 'all') {
            map.setFilter('dolphins-pnt', null); // show all species
        } else {
            map.setFilter('dolphins-pnt', [
                '==',
                ['get', 'species'],
                selected // show selected species
            ]);
        }
    });
    // CREATE POPUP ON CLICK DISPLAYING SPECIES AND NUM_SEEN
    map.on('click', 'dolphins-pnt', (e) => {
        const feature = e.features[0];
        const coordinates = feature.geometry.coordinates.slice();
        const numseen = feature.properties.num_seen;
        const dateseen = feature.properties.date;
        const species = feature.properties.species;

        popup
            .setLngLat(coordinates)
            .setHTML(`<strong>${species}</strong><br>Dolphins seen: ${numseen}</strong><br>Date seen: ${dateseen}`) // display species, num_seen, and date
            .addTo(map);
    });

    // CHANGE CURSOR ON HOVER TO INDICATE CLICKABILITY
    map.on('mouseenter', 'dolphins-pnt', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'dolphins-pnt', () => {
        map.getCanvas().style.cursor = '';
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
    { label: 'Frasers Dolphin', colour: '#5589f9' } // dark blue for fraser dolphin
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
        zoom: 6, // Clicking the button returns the zoom to 6
        essential: true
    });
});
