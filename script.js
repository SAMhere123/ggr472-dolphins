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
let selected = 'all'; // by default the selected species is all
let timeframe = 0; // by default the timeframe on the slider is all
/*--------------------------------------------------------------------
MAP CONTROLS: zoom, rotation, and fullscreen
--------------------------------------------------------------------*/
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.FullscreenControl());

const popup = new mapboxgl.Popup({ // add popup const
    closeButton: true,
    closeOnClick: true
});

const intervals = [ // create labels for the slider timeframe intervals
    { label: 'All'},
    { label: '1993-1997', start: 1993, end: 1997 },
    { label: '1998-2002', start: 1998, end: 2002 },
    { label: '2003-2007', start: 2003, end: 2007 },
    { label: '2008-2012', start: 2008, end: 2012 },
    { label: '2013-2017', start: 2013, end: 2017 }
];

/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/

// Load the map
map.on('load', () => {

    // 1. ADD DATA SOURCES
    // Add a data source containing GeoJSON data
    map.addSource('dolphins', {
        'type': 'geojson',
        'data': dolphinData // Add dolphins point data source path
    });

    // for spatial analysis
    map.addSource('clusters', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: []
        }
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

    map.addLayer({
        id: 'clusters-layer',
        type: 'circle',
        source: 'clusters',
        paint: {
            'circle-radius': 6,
            'circle-color': '#ee55f9',
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
    applyFilters();
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
    { label: 'Frasers Dolphin', colour: '#5589f9' }, // dark blue for fraser dolphin
    { label: 'Hotspot Cluster', colour: '#ee55f9' } // purple for hotspot clusters
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

document.getElementById('time-label').textContent = intervals[0].label;

const slider = document.getElementById('time-slider'); // create slider
const label = document.getElementById('time-label'); // create label for the slider

let timeout;

slider.addEventListener('input', () => { // create slider event listener
    clearTimeout(timeout);
    
    timeframe = parseInt(slider.value); // timeframe is equal to the slider value
    label.textContent = intervals[timeframe].label; // change the slider label based on the timeframe on the slider
    timeout = setTimeout(() => {
        applyFilters();
    }, 50);
});

function getFilteredFeatures() {
    let features = dolphinData.features;

    // species filter
    if (selected !== 'all') {
        features = features.filter(f => f.properties.species === selected);
    }

    // timeframe filter
    if (timeframe !== 0) {
        const { start, end } = intervals[timeframe];

        features = features.filter(f => {
            const year = parseInt(f.properties.date.slice(0, 4));
            return year >= start && year <= end;
        });
    }

    return features;
}

function computeClusters(features) {
    if (!features.length) return [];

    const fc = turf.featureCollection(features);

    const clustered = turf.clustersDbscan(fc, {
        maxDistance: 20,
        minPoints: 3
    });

    const groups = {};

    clustered.features.forEach(f => {
        const id = f.properties.cluster;
        if (id === undefined) return;

        if (!groups[id]) groups[id] = [];
        groups[id].push(f);
    });

    return Object.values(groups).map(group =>
        turf.centroid(turf.featureCollection(group))
    );
}

// applyFilters function to stop timeframe and species filters from overwriting each other
function applyFilters() {
    let filters = ['all']; // by default the map filters to all species and no timeframe filter

    // Species filter
    if (selected !== 'all') { // if species select is not all
        filters.push(['==', ['get', 'species'], selected]); // add selected species to filters
    }

    // Time interval filter
    if (timeframe !== 0) { // if the slider is not in the left-most position
    filters.push([ // add selected timeframe to filters depending on slider
        'all',
        ['>=', ['to-number', ['slice', ['get', 'date'], 0, 4]], intervals[timeframe].start],
        ['<=', ['to-number', ['slice', ['get', 'date'], 0, 4]], intervals[timeframe].end]]);
    }
    map.setFilter('dolphins-pnt', filters); // apply filters to the map

    const filtered = getFilteredFeatures();
    const centroids = computeClusters(filtered);

    map.getSource('clusters').setData({
        type: 'FeatureCollection',
        features: centroids
    });
}