const STORAGE_KEY_ACHIEVED_STAMPS = 'achieved_stamps'
const stampOpenIcon = L.icon({
    iconUrl: 'images/markers/red.png',
})
const stampAchievedIcon = L.icon({
    iconUrl: 'images/markers/green.png',
})

let Map = null
let MarkerGroup = null

const getStamps = () => {
    const achieved = localStorage.getItem(STORAGE_KEY_ACHIEVED_STAMPS)
    return achieved ? JSON.parse(achieved) : []
}

const saveStamps = (stamps) => {
    localStorage.setItem(STORAGE_KEY_ACHIEVED_STAMPS, JSON.stringify(stamps))
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

const exportProgress = () => {
    const localStorageJSONEncodedBase64 = btoa(JSON.stringify(getStamps()))
    window.location.href = 'data:application/octet-stream;base64,' + localStorageJSONEncodedBase64;

}

const importProgrss = async () => {
    const [fileHandle] = await window.showOpenFilePicker()
    const file = await fileHandle.getFile()
    const fileContent = JSON.parse(await file.text())
    saveStamps(fileContent)
    addMarkers()
}

const addMarkers = () => {
    MarkerGroup.clearLayers()

    const preparedLocations = locations.map(location => {
        return {...location, ...{ "achieved": getStamps().includes(location.stamp) }}
    })

    preparedLocations.map(location => {
        const marker = L.marker(
            [location.point.lat, location.point.lng],
            {
                icon: location.achieved ? stampAchievedIcon : stampOpenIcon
            }
        ).addTo(MarkerGroup);
        marker.bindPopup(`
            <p>
                <a target="_blank" href="${location.external_link}">${location.title}</a>
            </p>
            <div>${location.point.lat.toFixed(5)}</div>
            <div>${location.point.lng.toFixed(5)}</div>
            <p>
                <button onClick="collectStamp(${location.stamp}, ${location.achieved})">${location.achieved ? 'Stempel zurücksetzten' : 'Stempel sammeln'}</button>
            </p>
        `)
    })
}

const initMap = () => {
    Map = L.map('map').setView([51.7, 10.7], 10);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(Map);
    MarkerGroup = L.featureGroup().addTo(Map);
    addMarkers()
}

addEventListener("DOMContentLoaded", () => {
    initMap()
});

