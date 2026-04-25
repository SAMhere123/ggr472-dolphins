const btn = document.getElementById("cascadia");
btn.addEventListener("click", () => {
    window.open("https://cascadiaresearch.org/support_crc/", "_blank");
});

const btn2 = document.getElementById("nmfs");
btn2.addEventListener("click", () => {
    window.open("https://marinesanctuary.org/get-involved/ways-to-give/", "_blank");
});

const btn3 = document.getElementById("hwf");
btn3.addEventListener("click", () => {
    window.open("https://www.wildhawaii.org/donate/", "_blank");
});

mapboxgl.accessToken = 'pk.eyJ1IjoiY2hlbmphbmEiLCJhIjoiY21rNGdpc3BoMDdiNzNlb3Yxbm02dGpwOCJ9.xYpWe_CkRr_Oe_Q-DtaVYw'; // *** Add Mapbox access token ***

//Initialize map
const map = new mapboxgl.Map({
    container: 'map',   // container id in HTML
    style: 'mapbox://styles/mapbox/standard',   //*** Add map style here ***
    config: {
        basemap: {
            theme: "standard"
        }
    },
    center: [-156.3, 20.8], // coordinates for map of Hawaii
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
    { label: 'All' },
    { label: '1993-1997', start: 1993, end: 1997 },
    { label: '1998-2002', start: 1998, end: 2002 },
    { label: '2003-2007', start: 2003, end: 2007 },
    { label: '2008-2012', start: 2008, end: 2012 },
    { label: '2013-2017', start: 2013, end: 2017 }
];

/*--------------------------------------------------------------------
VIEW GEOJSON POINT DATA ON MAP - Dolphin Sightings
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
        selected = dropdown.value; // selected value is the dropdown value
        applyFilters(); // use applyFilters function
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
    document.getElementById('time-label').textContent = intervals[0].label;
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

const slider = document.getElementById('time-slider'); // create slider
const label = document.getElementById('time-label'); // create label for the slider

slider.addEventListener('input', () => { // create slider event listener
    timeframe = parseInt(slider.value); // timeframe is equal to the slider value
    label.textContent = intervals[timeframe].label; // change the slider label based on the timeframe on the slider
    applyFilters(); // use applyFilters function
});

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
}

/*--------------------------------------------------------------------
VIEW GEOJSON POINT DATA ON MAP - Temperature station data
--------------------------------------------------------------------*/
mapboxgl.accessToken = 'pk.eyJ1Ijoic2FtaGVyZTEyMyIsImEiOiJjbWtkbnFtNXAwZW9iM2Zwcjc3eWZpMjFsIn0.xMGFvUR2mK0MK7uEbzr2MQ'; // *** Add Mapbox access token ***
//load the map
map.on('load', () => {

    // Add a data source containing GeoJSON data
    map.addSource('stations', {
        'type': 'geojson',
        'data': 'https://raw.githubusercontent.com/SAMhere123/ggr472-dolphins/main/Data/station_data_temp_1993_2017.geojson' // Add temperature data source path
    });

    map.addLayer({
        id: 'temp-heatmap',
        type: 'heatmap',
        source: 'stations',
        maxzoom: 12,
        paint: {
            'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['get', 'X1993.01'],   // or your averaged temp expression
                10, 0.2,
                30, 1
            ],
            'heatmap-intensity': 1.2,
            'heatmap-radius': 40,
            'heatmap-opacity': 0.75,
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(0,0,255,0)',
                0.2, 'blue',
                0.4, 'cyan',
                0.6, 'lime',
                0.8, 'yellow',
                1, 'red'
            ]
        }
    });

    map.setLayoutProperty('temp-heatmap', 'visibility', 'none');

    document.getElementById('toggle-heatmap').addEventListener('click', () => {
        const btn = document.getElementById('toggle-heatmap');
        const visibility = map.getLayoutProperty('temp-heatmap', 'visibility');

        if (visibility === 'none' || visibility === undefined) {
            map.setLayoutProperty('temp-heatmap', 'visibility', 'visible');
            btn.textContent = "Hide Temperature Heatmap";
        } else {
            map.setLayoutProperty('temp-heatmap', 'visibility', 'none');
            btn.textContent = "Show Temperature Heatmap";
        }
    });


    /*-----------------------------------------------------------------------------
    Temperature station data point features
    -----------------------------------------------------------------------------*/


    function generateFields(start, end) {
        const fields = [];
        for (let y = start; y <= end; y++) {
            for (let m = 1; m <= 12; m++) {
                const mm = m.toString().padStart(2, '0');
                fields.push(`X${y}.${mm}`);
            }
        }
        return fields;
    }

    map.addLayer({
        id: 'station-temp',
        type: 'circle',
        source: 'stations',
        paint: {
            'circle-radius': 4,
            'circle-color': '#521163'
        }
    });

    function updateTemperatureLayer() {
        if (timeframe === 0) {
            // Show neutral color when "All" is selected
            map.setPaintProperty('station-temp', 'circle-color', '#521163');
            return;
        }

        const fields = tempFields[timeframe];
        const sumExpression = ['+', ...fields.map(f => ['to-number', ['get', f]])];     // Build a Mapbox expression that averages all fields
        const avgExpression = ['/', sumExpression, fields.length];

        map.setPaintProperty('station-temp', 'circle-color', [
            'interpolate',
            ['linear'],
            avgExpression,
            10, '#2c7bb6',
            20, '#abd9e9',
            25, '#ffffbf',
            30, '#fdae61',
            35, '#d7191c'
        ]);
    }

    map.on('click', 'station-temp', (e) => {
        const feature = e.features[0];
        const props = feature.properties;

        new mapboxgl.Popup()
            .setLngLat(feature.geometry.coordinates)
            .setHTML(`
                <strong>${props["Station.Name"]}</strong><br>
                Lat: ${props["LAT"]}, Long: ${props["LON"]}<br>
                Elevation: ${props["ELEV.m."]} m<br>
                Date: 1993.01, Temp: ${props["X1993.01"]} °C
            `)
            .addTo(map);
    });

    //Change cursor on hover
    map.on(`mouseenter`, `station-temp`, () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'station-temp', () => {
        map.getCanvas().style.cursor = '';
    });

    let html = `<strong>${overlapping.length} stations here:</strong><br><br>`;

    overlapping.forEach((f, i) => {
        html += `<button onclick="showStation(${f.properties.OBJECTID})">
                       ${f.properties["Station.Name"]}
                   </button><br>`;


        function showStation(id) {
            const f = map.querySourceFeatures('stations').find(x => x.properties.OBJECTID == id);
        // show popup with full details
        }
        const feature = e.features[0];
        const props = feature.properties;

        const overlapping = map.queryRenderedFeatures({
            layers: ['station-temp'],
            filter: ['==', ['get', 'LAT'], clicked.properties.LAT]
        });

        if (overlapping.length > 1) {
            expandPoints(overlapping);
        } else {
            showPopup(clicked);
        }

    });
});
