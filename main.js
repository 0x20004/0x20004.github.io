const LOCAL_STORAGE_KEY_ACHIEVED_STAMPS = 'achieved_stamps'
const ICON_STAMP_UNACHIEVED = L.icon({
    iconUrl: 'images/markers/red.png',
    iconAnchor: L.point(16, 32),
})
const ICON_STAMP_ACHIEVED = L.icon({
    iconUrl: 'images/markers/green.png',
    iconAnchor: L.point(16, 32),
})
const ICON_POSITION = L.icon({
    iconUrl: 'images/markers/arrow.png',
    iconAnchor: L.point(16, 16),
})

let Map = null
let MapMarkerGroupStamp = null
let MapMarkerGpsPosition = null
let MapRadiusGpsPosition = null

const getStamps = () => {
    const achieved = localStorage.getItem(LOCAL_STORAGE_KEY_ACHIEVED_STAMPS)
    return achieved ? JSON.parse(achieved) : []
}

const saveStamps = (stamps) => {
    localStorage.setItem(LOCAL_STORAGE_KEY_ACHIEVED_STAMPS, JSON.stringify(stamps))
}

const collectStamp = (stamp, alreadyAchieved) => {
    let achievedStamps = getStamps()
    if (alreadyAchieved) {
        achievedStamps = achievedStamps.filter(s => s !== stamp)
    } else {
        achievedStamps.push(stamp)
    }
    saveStamps(achievedStamps)
    addMarkers()
}

const exportAchievedStamps = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(getStamps()));
    const downloadAnchorElement = document.getElementById('downloadAnchorElement');
    downloadAnchorElement.setAttribute('href', dataStr);
    downloadAnchorElement.setAttribute('download', 'hwn_erreichte_stempelstellen.json');
    downloadAnchorElement.click();
}

const importAchievedStamps = async () => {
    const uploadAnchorElement = document.getElementById('uploadAnchorElement')
    uploadAnchorElement.click()
}

const handleImportAchievedStampsFileChange = event => {
    const uploadAnchorElement = document.getElementById('uploadAnchorElement')
    const file = uploadAnchorElement.files[0]
    if (file) {
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = (evt) => {
            let fileContent = JSON.parse(evt.target.result)
            if (Array.isArray(fileContent)) {
                fileContent = fileContent.filter(Number).filter(stamp => stamp <= MAX_STAMP_NUMBER)
                saveStamps(fileContent)
                addMarkers()
            } else {
                alert('Die Datei konnte nicht geladen werden. Fehlerhaftes Format.')
            }
        }
        reader.onerror = () => {
            alert('Die Datei konnte nicht geladen werden.')
        }
    }
}

const flyToMarker = () => {
    const stampToFocus = parseInt(document.getElementById('stampSearchInput').value, 10)
    if (stampToFocus <= 0 || stampToFocus > MAX_STAMP_NUMBER) {
        return
    }
    const location = locations.find(location => location.stamp_number === stampToFocus)
    if (location) {
        Map.flyTo([location.coords.lat, location.coords.lng], 15)
    }
}

const addMarkers = () => {
    MapMarkerGroupStamp.clearLayers()

    const achievedStamps = getStamps()

    const preparedLocations = locations.map(location => {
        return {...location, ...{ 'achieved': achievedStamps.includes(location.stamp_number) }}
    })

    preparedLocations.map(location => {
        const marker = L.marker(
            [location.coords.lat, location.coords.lng],
            {
                icon: location.achieved ? ICON_STAMP_ACHIEVED : ICON_STAMP_UNACHIEVED
            }
        ).addTo(MapMarkerGroupStamp);

        marker.bindPopup(`
            <p>
                <a target="_blank" href="${location.external_link}">${location.title}</a>
            </p>
            <div>${location.coords.lat.toFixed(5)}</div>
            <div>${location.coords.lng.toFixed(5)}</div>
            <p>
                <button onClick="collectStamp(${location.stamp_number}, ${location.achieved})">${location.achieved ? 'Stempel zurücksetzten' : 'Stempel sammeln'}</button>
            </p>
        `)
    })
}

const initMap = () => {
    Map = L.map('map').setView([51.7, 10.7], 10);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(Map);
    MapMarkerGroupStamp = L.featureGroup().addTo(Map);
    addMarkers()
}

const initGPS = () => {
    if (navigator.geolocation) {
        MapRadiusGpsPosition = L.circle([0,0], 0).addTo(Map);
        MapMarkerGpsPosition = L.marker(
            [0, 0],
            {
                icon: ICON_POSITION,
            }
        ).addTo(Map);

        navigator.geolocation.watchPosition(position => {
            const latLng = L.latLng(position.coords.latitude, position.coords.longitude)

            MapMarkerGpsPosition.setLatLng(latLng)

            MapRadiusGpsPosition.setLatLng(latLng)
            MapRadiusGpsPosition.setRadius(position.coords.accuracy >= 50 ? position.coords.accuracy : 0)

            if (position.coords.heading) {
                MapMarkerGpsPosition.setRotationAngle(position.coords.heading)
            }
        });
    }
}

addEventListener('DOMContentLoaded', () => {
    initMap()

    const uploadAnchorElement = document.getElementById('uploadAnchorElement')
    uploadAnchorElement.addEventListener('change', handleImportAchievedStampsFileChange, false)

    initGPS()
});

