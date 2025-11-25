// map.js - Lógica do mapa e marcadores

let mapInstance = null;
let clusterGroupInstance = null;
let isComparisonModeCallback = null;
let selectPointForComparisonCallback = null;
let addFamilyMemberToFilterCallback = null;
let familiaMap = new Map();


/**
 * Inicializa e configura o mapa do Leaflet.
 * @param {Function} isComparisonMode - Função para checar se o modo de comparação está ativo.
 * @param {Function} selectPointForComparison - Função para selecionar um ponto no modo de comparação.
 * @returns {L.Map} A instância do mapa.
 */
export function initializeMap(isComparisonMode, selectPointForComparison) {
    mapInstance = L.map('map', {
        maxBounds: [[-90, -180], [90, 180]],
        maxBoundsViscosity: 1.0,
        minZoom: 3,
        maxZoom: 18,
        preferCanvas: true
    }).setView([-15, -55], 4);
    
    // Armazena as funções de callback
    isComparisonModeCallback = isComparisonMode;
    selectPointForComparisonCallback = selectPointForComparison;
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        noWrap: true,
        bounds: [[-90, -180], [90, 180]]
    }).addTo(mapInstance);
    
    clusterGroupInstance = L.markerClusterGroup({
        maxClusterRadius: 0,
        spiderfyOnMaxZoom: true,
        chunkedLoading: true
    });
    mapInstance.addLayer(clusterGroupInstance);

    // Evento de clique no mapa para selecionar pontos fora dos marcadores
    mapInstance.on('click', (e) => {
        if (isComparisonModeCallback()) {
            L.DomEvent.stopPropagation(e);
            selectPointForComparisonCallback({
                lat: e.latlng.lat,
                lng: e.latlng.lng,
                genero: `Ponto ${selectPointForComparisonCallback.length + 1}`
            });
        }
    });
    
    // Evento de abertura do popup para inicializar interações
    mapInstance.on('popupopen', function(e) {
        const popupContent = e.popup.getElement().querySelector('.leaflet-popup-content');
        if (!popupContent) return;

    

        // Lógica para os links de membros da família no popup
        const linksParentes = popupContent.querySelectorAll('.add-family-member');
        linksParentes.forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const genre = this.getAttribute('data-genero');
                if (addFamilyMemberToFilterCallback) {
                    addFamilyMemberToFilterCallback(genre);
                    mapInstance.closePopup();
                }
            });
        });
    });

    return mapInstance;
}

/**
 * Desenha os marcadores no mapa com base nos pontos fornecidos.
 * @param {Array<Object>} pointsToDraw - Array de objetos de pontos.
 */
export function drawMarkers(pointsToDraw) {
    clusterGroupInstance.clearLayers();
    const groups = {};
    pointsToDraw.forEach(point => {
        const key = `${point.lat},${point.lng}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(point);
    });

    Object.values(groups).forEach(group => {
        const popupContent = group.map(p => createPopup(p)).join('<hr>');
        const referencePoint = group[0];
        const style = getMarkerStyle(referencePoint.periodo);
        
        const circleMarker = L.circleMarker([referencePoint.lat, referencePoint.lng], style);

        circleMarker.on('click', (e) => {
            if (isComparisonModeCallback()) {
                L.DomEvent.stopPropagation(e);
                selectPointForComparisonCallback(referencePoint);
            }
        });
        
        circleMarker.addTo(clusterGroupInstance).bindPopup(popupContent);
    });

    if (clusterGroupInstance.getLayers().length > 0) {
        mapInstance.fitBounds(clusterGroupInstance.getBounds().pad(0.5));
    }
}

/**
 * Define o mapa de famílias e o callback para adicionar membros.
 * Esta função deve ser chamada apenas uma vez, após o carregamento dos dados.
 * @param {Map} newFamiliaMap - O mapa de famílias (família -> gêneros).
 * @param {Function} addFamilyMemberToFilterFn - A função de callback para adicionar um membro ao filtro.
 */
export function setFamiliaDataAndCallback(newFamiliaMap, addFamilyMemberToFilterFn) {
    familiaMap = newFamiliaMap;
    addFamilyMemberToFilterCallback = addFamilyMemberToFilterFn;
}

/**
 * Retorna o estilo do marcador com base no período.
 * @param {string} period - O nome do período (cretaceo, jurassico, etc.).
 * @returns {Object} O objeto de estilo do marcador.
 */
function getMarkerStyle(period) {
    let color = '#ff9900'; // default
    if (period === 'cretaceo') color = '#ff0800';
    else if (period === 'jurassico') color = '#5cb85c';
    else if (period === 'triassico') color = '#5bc0de';
    else if (period === 'cambriano') color = '#8D6F3B';
    else if (period === 'ordoviciano') color = '#A7A6A8';
    else if (period === 'siluriano') color = '#C1D18A';
    else if (period === 'devoniano') color = '#D78B2E';
    else if (period === 'carbonifero') color = '#4D887C';
    else if (period === 'permiano') color = '#A22225';
    else if (period === 'paleogeno') color = '#ffe600';
    else if (period === 'neogeno') color = '#ff00c8ff';
    else if (period === 'quaternario') color = '#ff006f';
    
    return { radius: 6, fillOpacity: 0.8, stroke: true, color: 'white', weight: 1.5, fillColor: color };
}

/**
 * Cria o conteúdo HTML para o popup de um ponto.
 * @param {Object} point - O objeto de dados do ponto.
 * @returns {string} O HTML formatado para o popup.
 */
function createPopup(point) {
    const familyHtml = (point.familia) ? `<b>Família:</b> ${point.familia}<br>` : '';
    const displayPeriod = point.periodo.charAt(0).toUpperCase() + point.periodo.slice(1);
    
    let familyMembersHtml = '';
    if (point.familia && point.familia !== 'Não definido' && familiaMap.has(point.familia)) {
        const relatives = Array.from(familiaMap.get(point.familia)).filter(g => g !== point.genero);
        if (relatives.length > 0) {
            familyMembersHtml += `<div class="parentes-container"><b>Membros da mesma família:</b><br>`;
            const relativesToDisplay = relatives.sort(() => 0.5 - Math.random()).slice(0, 4);
            relativesToDisplay.forEach(relative => {
                familyMembersHtml += `<a href="#" class="add-family-member" data-genero="${relative}">${relative}</a> `;
            });
            familyMembersHtml += `</div>`;
        }
    }

    // Wrap the image and everything below it in a new div for more precise control.
    return `<b>${point.genero} ${point.especie || ''}</b><br>
            ${familyHtml}
            <b>Formação:</b> ${point.formacao}<br>
            <b>Período:</b> ${displayPeriod}<br>
            <b>Início:</b> ${point.inicio} M.A. – <b>Fim:</b> ${point.fim} M.A.<br>
            <div class="popup-content-inner">
                <img class="popup-imagem" src="${point.imagem}" alt="${point.genero}" style="width:200px; border-radius:6px; margin-top: 5px; cursor: zoom-in;" onerror="this.style.display='none';">
                 <div class="artist-info"><b>Artista: </b>Paleohistoric on DeviantArt</div>
                ${familyMembersHtml} 
            </div>`;
}


