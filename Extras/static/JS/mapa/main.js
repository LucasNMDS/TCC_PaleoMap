// main.js - O orquestrador principal da aplicação

import { fetchData } from './api.js';
import { initializeMap, drawMarkers, setFamiliaDataAndCallback } from './map.js';
import { 
    initializeFilters, 
    applyGlobalFilters, 
    toggleComparisonMode, 
    selectPointForComparison,
    isComparisonMode,
    addFamilyMemberToFilter,
    familiaMap
} from './filters.js';
import { initializeUIInteractions } from './interactions.js';

let allData = [];
let allGeoJson = null;

(async function () {
    const infoPainel = document.getElementById('info-painel');
    infoPainel.innerHTML = '<p>Contactando o servidor para obter os dados paleontológicos...</p>';

    try {
        // 1. Buscar dados do backend
        const apiResult = await fetchData();
        allData = apiResult.dados_processados;

        if (!allData || allData.length === 0) {
            throw new Error("O servidor não retornou nenhum registro de fóssil válido.");
        }

        console.log(`Dados processados recebidos! Total de ${allData.length} ocorrências.`);
        infoPainel.innerHTML = '<p>Dados recebidos! Carregando mapa...</p>';

        // 2. Carregar dados geográficos (GeoJSON)
        const responseGeo = await fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json');
        if (!responseGeo.ok) {
            throw new Error(`Erro ao carregar GeoJSON: ${responseGeo.statusText}`);
        }
        allGeoJson = await responseGeo.json();

        // 3. Inicializar e conectar os módulos
        
        // Inicializa o mapa, passando as funções de callback que ele precisa
        // O mapa precisa saber se está no modo de comparação e como selecionar um ponto
        const map = initializeMap(isComparisonMode, (point) => selectPointForComparison(map, point));

        // Define os dados de família e o callback para o mapa
        setFamiliaDataAndCallback(familiaMap, addFamilyMemberToFilter);
        
        // Inicializa os filtros, passando o mapa e a função de desenhar marcadores
        // O filters.js precisa da função drawMarkers para atualizar o mapa
        initializeFilters(allData, allGeoJson, map, drawMarkers);

        // Inicializa as interações da UI
        // A lógica de toggle é responsabilidade do filters.js, mas o botão está na UI
        initializeUIInteractions(map, () => toggleComparisonMode(map));
        
        // 4. Rodar o filtro inicial para carregar todos os marcadores no mapa
        applyGlobalFilters();

    } catch (error) {
        console.error("ERRO CRÍTICO AO INICIALIZAR:", error);
        document.body.innerHTML = `<h1>Ocorreu um erro ao carregar o mapa.</h1><p>Verifique o console do navegador (F12) para mais detalhes.</p><p style="color:red;"><strong>Erro:</strong> ${error.message}</p>`;
    }
})();