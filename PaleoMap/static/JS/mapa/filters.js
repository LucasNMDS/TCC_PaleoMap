// filters.js - Lógica de filtros e botões de ação

let allData = [];
let allGeoJson = null;

const infoPainel = document.getElementById('info-painel');
const paisSelect = document.getElementById('pais-select');
const buscaInput = document.getElementById('busca');
const familiaSelect = document.getElementById('familia');
const slider = document.getElementById('slider');
const label = document.getElementById('label-range');
const container = document.getElementById('resultados');
const exibirSelecionados = document.getElementById('exibirSelecionados');
const limparSelecionados = document.getElementById('limparSelecionados');
const compararDistanciaBtn = document.getElementById('compararDistancia');

const filtersState = {
    periodo: null,
    familia: '',
    pais: 'todos',
    slider: [450, 0],
    especies: new Set()
};

const selectedItems = new Set();
let comparisonMode = false;
let comparisonPoints = [];
let distanceLine = null;
let visualMarkers = [];
let isUpdatingSliderProgrammatically = false;
let highlightedCountryLayer = null;
let userInteractingWithSlider = false;

let familiaMap = new Map();

let visibleFamiliesCache = [];
let visibleCountriesCache = [];


// Variáveis para as funções de callback
let drawMarkersCallback = null;
let mapInstance = null;

/**
 * Inicializa a lógica de filtros e botões.
 * Recebe as funções de callback para evitar dependência circular.
 * @param {Array<Object>} data - Os dados brutos dos fósseis.
 * @param {Object} geoJson - O objeto GeoJSON dos países.
 * @param {L.Map} map - A instância do mapa.
 * @param {Function} drawMarkersFn - A função para desenhar marcadores no mapa.
 */
export function initializeFilters(data, geoJson, map, drawMarkersFn) {
    allData = data;
    allGeoJson = geoJson;
    mapInstance = map;
    drawMarkersCallback = drawMarkersFn; // Salva a função de callback

    allData.forEach(ponto => {
        if (ponto.familia && ponto.familia !== 'Não definido') {
            if (!familiaMap.has(ponto.familia)) {
                familiaMap.set(ponto.familia, new Set());
            }
            familiaMap.get(ponto.familia).add(ponto.genero);
        }
    });

    const countriesWithFossils = allGeoJson.features.filter(feature => {
        return allData.some(ponto => turf.booleanPointInPolygon(turf.point([ponto.lng, ponto.lat]), feature.geometry));
    });
    countriesWithFossils.sort((a, b) => a.properties.name.localeCompare(b.properties.name));
    countriesWithFossils.forEach(feature => {
        const option = document.createElement('option');
        option.value = feature.id;
        option.textContent = feature.properties.name;
        paisSelect.appendChild(option);
    });

noUiSlider.create(slider, {
    start: [450, 0], 
    connect: true, 
    direction: 'rtl', 
    range: { min: 0, max: 450 }, 
    step: 0.1,
    tooltips: [{ to: v => Number(v).toFixed(1) }, { to: v => Number(v).toFixed(1) }]
});


slider.noUiSlider.on('start', () => {
    userInteractingWithSlider = true;
});

slider.noUiSlider.on('end', () => {
    userInteractingWithSlider = false;
});

    slider.noUiSlider.on('change', function(values) {
        if (isUpdatingSliderProgrammatically) return;
        filtersState.slider = [parseFloat(values[0]), parseFloat(values[1])];
        applyGlobalFilters();
    });
slider.noUiSlider.on('update', values => label.textContent = `${Number(values[0]).toFixed(1)} - ${Number(values[1]).toFixed(1)}`);

const periodosGeologicos = {
  quaternario: [2.58, 0],
  neogeno: [23.03, 2.58],
  paleogeno: [66, 23.03],
  cretaceo: [145, 66],
  jurassico: [201.3, 145],
  triassico: [251.9, 201.3],
  permiano: [298.9, 251.9],
  carbonifero: [358.9, 298.9],
  devoniano: [419.2, 358.9],
  siluriano: [443.8, 419.2],
  ordoviciano: [485.4, 443.8],
  cambriano: [541, 485.4],
  outro: [450, 0]
};

document.querySelectorAll('.legenda-item').forEach(item => 
  item.addEventListener('click', e => {
    const periodName = e.currentTarget.id.replace('legenda-', '').toLowerCase();

    document.querySelectorAll('.legenda-item').forEach(el => el.classList.remove('legenda-ativa'));

    filtersState.periodo = (filtersState.periodo === periodName) ? null : periodName;

    if (filtersState.periodo) e.currentTarget.classList.add('legenda-ativa');

    if (periodosGeologicos[periodName]) {
      const [maxAge, minAge] = periodosGeologicos[periodName];
      filtersState.slider = [maxAge, minAge];
      isUpdatingSliderProgrammatically = true;
      slider.noUiSlider.set([maxAge, minAge]);
      isUpdatingSliderProgrammatically = false;
    }

    applyGlobalFilters();
  })
);
    paisSelect.addEventListener('change', () => {
        filtersState.pais = paisSelect.value;
        const pointsForCalc = (filtersState.pais === 'ATA') ? allData.filter(p => p.lat <= -60.0) :
                             (filtersState.pais !== 'todos') ? allData.filter(p => turf.booleanPointInPolygon(turf.point([p.lng, p.lat]), allGeoJson.features.find(f => f.id === filtersState.pais).geometry)) :
                             allData;
        
        if (pointsForCalc.length > 0 && filtersState.pais !== 'todos') {
            const maxAge = Math.max(...pointsForCalc.map(d => d.inicio)); 
            const minAge = Math.min(...pointsForCalc.map(d => d.fim));
            filtersState.slider = [maxAge, minAge];
            isUpdatingSliderProgrammatically = true;
            slider.noUiSlider.set([Math.max(maxAge, minAge), Math.min(maxAge, minAge)]);
            isUpdatingSliderProgrammatically = false;
        } else {
            filtersState.slider = [450, 0];
            isUpdatingSliderProgrammatically = true;
            slider.noUiSlider.set([450, 0]);
            isUpdatingSliderProgrammatically = false;
        }
        applyGlobalFilters();
    });
familiaSelect.addEventListener('change', () => {
    familiaSelect.addEventListener('change', () => {
    filtersState.familia = familiaSelect.value || null; 
    applyGlobalFilters();
});

    filtersState.familia = selectedFamily;
    if (selectedFamily) {
        basePoints = basePoints.filter(p => p.familia === selectedFamily);
    }

    // Atualiza o mapa e painel
    if (drawMarkersCallback) drawMarkersCallback(basePoints);
    updateInfoPanel(basePoints, selectedFamily ? `da família ${selectedFamily}` : "no filtro atual");
});
    buscaInput.addEventListener('input', () => {
        const term = buscaInput.value.trim().toLowerCase();
        const results = term ? allData.filter(p => p.genero.toLowerCase().includes(term)) : [];
        populateSpeciesList(results);
    });
    exibirSelecionados.addEventListener('click', updateMapWithSelected);
    limparSelecionados.addEventListener('click', resetFilters);
    compararDistanciaBtn.addEventListener('click', () => toggleComparisonMode(mapInstance));
}

/**
 * Aplica todos os filtros globais e atualiza o mapa.
 */
export function applyGlobalFilters() {
    let filteredPoints = [...allData];
    let context = "no total";

    if (highlightedCountryLayer) {
        mapInstance.removeLayer(highlightedCountryLayer);
        highlightedCountryLayer = null;
    }

    // Filtro pelo slider
    let [left, right] = filtersState.slider;
    const max = Math.max(left, right);
    const min = Math.min(left, right);
    filteredPoints = filteredPoints.filter(ponto => ponto.inicio <= max && ponto.fim >= min);

    // Filtro por período
    if (filtersState.periodo) {
        const mainPeriods = ['cretaceo','jurassico','triassico','cambriano','ordoviciano','siluriano','devoniano','carbonifero','permiano','paleogeno','neogeno','quaternario'];
        filteredPoints = (filtersState.periodo === 'outro')
            ? filteredPoints.filter(p => !mainPeriods.includes(p.periodo))
            : filteredPoints.filter(p => p.periodo === filtersState.periodo);
        const periodNameDisplay = filtersState.periodo.charAt(0).toUpperCase() + filtersState.periodo.slice(1);
        context = `do período ${periodNameDisplay}`;
    }

    // Filtro por país
    if (filtersState.pais !== 'todos') {
        if (filtersState.pais === 'ATA') {
            filteredPoints = filteredPoints.filter(p => p.lat <= -60.0);
            context = `na região da Antártica`;
        } else {
            const countryFeature = allGeoJson.features.find(f => f.id === filtersState.pais);
            if (countryFeature) {
                filteredPoints = filteredPoints.filter(p =>
                    turf.booleanPointInPolygon(turf.point([p.lng, p.lat]), countryFeature.geometry)
                );
                context = `em ${countryFeature.properties.name}`;
            }
        }
    }

    // Filtro por família
    if (filtersState.familia) {
        filteredPoints = filteredPoints.filter(p => p.familia === filtersState.familia);
        context = `da família ${filtersState.familia}`;
    }

    // Redesenha os marcadores e atualiza painel
    if (drawMarkersCallback) drawMarkersCallback(filteredPoints);
    updateInfoPanel(filteredPoints, context);
    updateFilterControls(filteredPoints);

    // 🔹 Atualiza o slider com prioridade família > país > período
    if (!userInteractingWithSlider && !isUpdatingSliderProgrammatically) {
    updateSliderWithPriority();
     }
}

function updateInfoPanel(points, context) {
    if (!infoPainel) return;
    if (points.length === 0) { infoPainel.innerHTML = `<p>Nenhum fóssil encontrado para o filtro atual.</p>`; return; }
    
    const totalOccurrences = points.length;
    let html = `<p>Mostrando <strong>${totalOccurrences}</strong> ocorrência(s) ${context}.</p>`;
    const speciesCount = {};
    points.forEach(point => {
        const fullName = `${point.genero} ${point.especie || ''}`.trim();
        if (point.genero !== 'Não identificado') {
            speciesCount[fullName] = (speciesCount[fullName] || 0) + 1;
        }
    });
    const sortedSpecies = Object.entries(speciesCount).sort((a, b) => b[1] - a[1]);
    if (sortedSpecies.length > 0) {
        const topSpecies = sortedSpecies.slice(0, 5).map(item => item[0]);
        html += `<br><p><strong>Espécies mais abundantes:</strong><br>${topSpecies.join(', ')}</p>`;
    }
    infoPainel.innerHTML = html;
}

function updateFilterControls(visiblePoints) {
    const currentFamilyValue = familiaSelect.value;
    const currentCountryValue = paisSelect.value;

    // 🔹 Famílias
    if (!currentFamilyValue) {
        visibleFamiliesCache = Array.from(new Set(
            visiblePoints.map(p => p.familia).filter(f => f && f !== 'Não definido')
        )).sort();
    }
    familiaSelect.innerHTML = '<option value="">Selecione uma família...</option>';
    visibleFamiliesCache.forEach(family => {
        const option = document.createElement('option');
        option.value = family;
        option.textContent = family;
        familiaSelect.appendChild(option);
    });
    familiaSelect.value = currentFamilyValue || '';

    // 🔹 Espécies
    const term = buscaInput.value.trim().toLowerCase();
    if (term) {
        const results = visiblePoints.filter(p => p.genero.toLowerCase().includes(term));
        populateSpeciesList(results);
    } else {
        container.innerHTML = '';
    }

    // 🔹 Países
    if (!currentCountryValue || currentCountryValue === 'todos') {
        visibleCountriesCache = new Set();
        allGeoJson.features.forEach(feature => {
            const hasFossils = visiblePoints.some(p =>
                turf.booleanPointInPolygon(turf.point([p.lng, p.lat]), feature.geometry)
            );
            if (hasFossils) visibleCountriesCache.add(feature.id);
        });
    }

    paisSelect.innerHTML = '<option value="todos">Todos os países</option>';
    allGeoJson.features
        .filter(f => visibleCountriesCache.has(f.id))
        .sort((a, b) => a.properties.name.localeCompare(b.properties.name))
        .forEach(f => {
            const option = document.createElement('option');
            option.value = f.id;
            option.textContent = f.properties.name;
            paisSelect.appendChild(option);
        });

    // Mantém o país selecionado se ele ainda estiver na lista
    if (currentCountryValue && visibleCountriesCache.has(currentCountryValue)) {
        paisSelect.value = currentCountryValue;
    } else {
        paisSelect.value = 'todos';
    }
}


function populateSpeciesList(pointsList) {
    container.innerHTML = '';
    if (pointsList.length === 0) { container.innerHTML = '<p>Nenhuma espécie encontrada para este filtro.</p>'; return; }
    const uniqueSpecies = new Map();
    pointsList.forEach(point => {
        const key = `${point.genero} ${point.especie || ''}`;
        if (!uniqueSpecies.has(key)) uniqueSpecies.set(key, point);
    });
    uniqueSpecies.forEach(point => {
        const block = document.createElement('div'); block.classList.add('resultado-item');
        const checkbox = document.createElement('input'); checkbox.type = 'checkbox';
        const checkboxValue = `${point.genero}|||${point.especie}`; checkbox.value = checkboxValue;
        if (selectedItems.has(checkboxValue)) { checkbox.checked = true; }
        checkbox.addEventListener('change', () => { 
            if (checkbox.checked) selectedItems.add(checkboxValue); 
            else selectedItems.delete(checkboxValue); 
        });
        block.appendChild(checkbox);
        const label = document.createElement('label'); 
        const familyHtml = (point.familia && point.familia !== 'Não catalogada') ? `<strong>Família:</strong> ${point.familia}<br>` : '';
        const displayPeriod = point.periodo.charAt(0).toUpperCase() + point.periodo.slice(1);
        label.innerHTML = ` <b>${point.genero} ${point.especie || ''}</b><br>${familyHtml}<strong>Formação:</strong> ${point.formacao}<br><strong>Período:</strong> ${displayPeriod}<br><b>Início:</b> ${point.inicio} M.A. – <strong>Fim:</strong> ${point.fim} M.A.`;
        block.appendChild(label); container.appendChild(block);
    });
}

function updateMapWithSelected() {
    if (selectedItems.size === 0) {
        alert("Nenhuma espécie selecionada.");
        return;
    }
    const selectedPoints = allData.filter(p => selectedItems.has(`${p.genero}|||${p.especie || ''}`));
    
    // Usa a função de callback para desenhar os marcadores
    if (drawMarkersCallback) {
        drawMarkersCallback(selectedPoints);
    }
    
    updateInfoPanel(selectedPoints, "selecionados");
    if(selectedPoints.length > 0) {
        const maxAge = Math.max(...selectedPoints.map(d => d.inicio));
        const minAge = Math.min(...selectedPoints.map(d => d.fim));
        filtersState.slider = [maxAge, minAge];
        isUpdatingSliderProgrammatically = true;
        slider.noUiSlider.set([Math.max(maxAge, minAge), Math.min(maxAge, minAge)]);
        isUpdatingSliderProgrammatically = false;
    }
}

/**
 * Adiciona um gênero à lista de selecionados e atualiza o mapa.
 * @param {string} genreToAdd - O gênero a ser adicionado.
 */
export function addFamilyMemberToFilter(genreToAdd) {
    const occurrences = allData.filter(p => p.genero === genreToAdd);
    occurrences.forEach(point => {
        const key = `${point.genero}|||${point.especie || ''}`;
        selectedItems.add(key);
    });
    updateMapWithSelected();
}

function resetFilters() {
    Object.assign(filtersState, {
        periodo: null, familia: '', pais: 'todos', slider: [450, 0]
    });
    selectedItems.clear();
    document.querySelectorAll('.legenda-item').forEach(el => el.classList.remove('legenda-ativa'));
    paisSelect.value = 'todos';
    familiaSelect.value = '';
    buscaInput.value = '';
    container.innerHTML = '';
    isUpdatingSliderProgrammatically = true;
    slider.noUiSlider.set([450, 0]);
    isUpdatingSliderProgrammatically = false;
    applyGlobalFilters();
}

function updateSliderWithPriority() {
    let filteredPoints = [...allData];

    // 🔹 Sempre filtra pelo período primeiro
    if (filtersState.periodo) {
        const mainPeriods = ['cretaceo','jurassico','triassico','cambriano','ordoviciano','siluriano','devoniano','carbonifero','permiano','paleogeno','neogeno','quaternario'];
        filteredPoints = (filtersState.periodo === 'outro')
            ? filteredPoints.filter(p => !mainPeriods.includes(p.periodo))
            : filteredPoints.filter(p => p.periodo === filtersState.periodo);
    }

    // 🔹 Filtra pelo país
    if (filtersState.pais !== 'todos') {
        if (filtersState.pais === 'ATA') {
            filteredPoints = filteredPoints.filter(p => p.lat <= -60.0);
        } else {
            const countryFeature = allGeoJson.features.find(f => f.id === filtersState.pais);
            if (countryFeature) {
                filteredPoints = filteredPoints.filter(p =>
                    turf.booleanPointInPolygon(turf.point([p.lng, p.lat]), countryFeature.geometry)
                );
            }
        }
    }

    // 🔹 Para o slider, prioriza a família
    let pointsForSlider = filteredPoints;

    if (filtersState.familia) {
        // família selecionada → pega apenas fósseis da família dentro do filtro atual
        pointsForSlider = filteredPoints.filter(p => p.familia === filtersState.familia);
    } 
    // Se não houver família, pointsForSlider = filteredPoints (período+país)
    // Se nenhum filtro, pointsForSlider = allData (já coberto)

    // 🔹 Atualiza o slider com intervalo
    if (pointsForSlider.length === 0) {
        filtersState.slider = [450, 0];
        isUpdatingSliderProgrammatically = true;
        slider.noUiSlider.set([450, 0]);
        isUpdatingSliderProgrammatically = false;
        return;
    }

    const maxAge = Math.max(...pointsForSlider.map(p => p.inicio));
    const minAge = Math.min(...pointsForSlider.map(p => p.fim));

    filtersState.slider = [maxAge, minAge];
    isUpdatingSliderProgrammatically = true;
    slider.noUiSlider.set([Math.max(maxAge, minAge), Math.min(maxAge, minAge)]);
    isUpdatingSliderProgrammatically = false;
}
/**
 * Alterna o modo de comparação de distância.
 * @param {L.Map} map - A instância do mapa.
 */
export function toggleComparisonMode(map) {
    comparisonMode = !comparisonMode;
    if (comparisonMode) {
        compararDistanciaBtn.textContent = 'Cancelar Comparação';
        compararDistanciaBtn.style.backgroundColor = '#d9534f';
        map.getContainer().style.cursor = 'crosshair';
        infoPainel.innerHTML = '<p><strong>Modo de Comparação:</strong> Clique no primeiro fóssil no mapa.</p>';
        comparisonPoints = [];
        if (distanceLine) { map.removeLayer(distanceLine); distanceLine = null; }
        visualMarkers.forEach(m => map.removeLayer(m));
        visualMarkers = [];
    } else {
        compararDistanciaBtn.textContent = 'Comparar Distância';
        compararDistanciaBtn.style.backgroundColor = '';
        map.getContainer().style.cursor = '';
        if (distanceLine) { map.removeLayer(distanceLine); distanceLine = null; }
        visualMarkers.forEach(m => map.removeLayer(m));
        visualMarkers = [];
        applyGlobalFilters();
    }
}

/**
 * Seleciona um ponto para a comparação de distância.
 * @param {L.Map} map - A instância do mapa.
 * @param {Object} point - O objeto do ponto a ser selecionado.
 */
export function selectPointForComparison(map, point) {
    if (!comparisonMode) return;
    comparisonPoints.push(point);
    const marker = L.circleMarker([point.lat, point.lng], { radius: 8, color: '#ffeb3b', fillColor: '#ffeb3b', fillOpacity: 0.7 }).addTo(map);
    visualMarkers.push(marker);
    if (comparisonPoints.length === 1) {
        infoPainel.innerHTML = `<p><strong>Ponto 1:</strong> <i>${point.genero}</i> selecionado. <br>Clique no segundo fóssil.</p>`;
    } else if (comparisonPoints.length === 2) {
        const pointA = comparisonPoints[0];
        const pointB = comparisonPoints[1];
        const from = turf.point([pointA.lng, pointA.lat]);
        const to = turf.point([pointB.lng, pointB.lat]);
        const distance = turf.distance(from, to, {units: 'kilometers'});
        distanceLine = L.polyline([[pointA.lat, pointA.lng], [pointB.lat, pointB.lng]], { color: '#ffeb3b', weight: 3, dashArray: '5, 10' }).addTo(map);
        infoPainel.innerHTML = `<p><strong>Comparação de Distância:</strong></p><p>De: <i>${pointA.genero}</i><br>Para: <i>${pointB.genero}</i></p><p><strong>Distância: ${distance.toFixed(2)} km</strong></p>`;
        setTimeout(() => { toggleComparisonMode(map); }, 5000);
    }
}

/**
 * Retorna o estado do modo de comparação.
 * @returns {boolean} True se o modo de comparação está ativo, False caso contrário.
 */
export function isComparisonMode() {
    return comparisonMode;
}

// Exporta o mapa de famílias para ser usado em outros arquivos
export { familiaMap };