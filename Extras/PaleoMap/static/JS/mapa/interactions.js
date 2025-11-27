// interactions.js - Interações da UI

import { addFamilyMemberToFilter } from './filters.js';

export function initializeUIInteractions(map) {
    const toggleButton = document.getElementById('toggle-panel-button');
    const filtrosContainer = document.getElementById('filtros-container');
    const curiosidadeContainer = document.getElementById('curiosidade-container');

    toggleButton.addEventListener('click', () => {
        filtrosContainer.classList.toggle('collapsed');
        toggleButton.innerHTML = filtrosContainer.classList.contains('collapsed') ? '«' : '»';
        toggleButton.style.right = filtrosContainer.classList.contains('collapsed') ? '15px' : '365px';
    });
    
    // Função para ajustar a posição ao carregar e redimensionar
    function adjustElements() {
        if (window.innerWidth > 768) {
            filtrosContainer.classList.remove('collapsed');
            toggleButton.style.display = 'block';
            toggleButton.style.right = '365px';
        } else {
            filtrosContainer.classList.add('collapsed');
            toggleButton.style.display = 'block';
            toggleButton.style.right = '15px';
        }
    }

    adjustElements();
    window.addEventListener('resize', adjustElements);

    // --- Lógica para o zoom da imagem no popup ---
    map.on('popupopen', function(e) {
        const popupContent = e.popup.getElement().querySelector('.leaflet-popup-content');
        if (!popupContent) return;
        const images = popupContent.querySelectorAll('.popup-imagem');
        images.forEach(img => {
            img.addEventListener('click', function() {
                const overlay = document.createElement('div');
                overlay.id = 'zoom-overlay';
                const imgClone = this.cloneNode();
                imgClone.className = 'imagem-zoom-ativa';
                imgClone.removeAttribute('style');
                document.body.appendChild(overlay);
                document.body.appendChild(imgClone);

                function fecharZoom() {
                    if (document.body.contains(overlay)) { document.body.removeChild(overlay); }
                    if (document.body.contains(imgClone)) { document.body.removeChild(imgClone); }
                }
                overlay.addEventListener('click', fecharZoom);
                imgClone.addEventListener('click', fecharZoom);
            });
        });

        // --- Lógica para os links de membros da família no popup ---
        const linksParentes = popupContent.querySelectorAll('.add-family-member');
        linksParentes.forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const genre = this.getAttribute('data-genero');
                addFamilyMemberToFilter(genre);
                map.closePopup();
            });
        });
    });

    // --- Lógica para a caixa de curiosidades ---
    const trivia = [
        "O Tiranossauro Rex tinha uma mordida tão poderosa que podia esmagar ossos com facilidade, uma força que poucos animais na história da Terra já possuíram.",
        "O Estegossauro, apesar de seu tamanho imenso, tinha um cérebro do tamanho de uma noz.",
        "O Argentinossauro é um dos maiores animais terrestres já descobertos, podendo atingir mais de 30 metros de comprimento.",
        "O Velociraptor, famoso nos cinemas, na verdade era do tamanho de um peru e coberto de penas.",
        "O período Cretáceo terminou com um evento de extinção em massa que eliminou cerca de 75% de todas as espécies do planeta, incluindo os dinossauros não-avianos.",
        "O Brasil possui um dos mais importantes sítios paleontológicos do mundo, a Bacia do Araripe, famosa por seus fósseis incrivelmente bem preservados.",
        "As estrelas que visualizamos hoje são diferentes das que os dinossauros viam pois eles estavam em um ponto totalmente diferente da galáxia.",
        "O Megalodon, tubarão pré-histórico, podia medir mais de 18 metros de comprimento e tinha dentes do tamanho de uma mão humana.",

        "O Quetzalcoatlus, um dos maiores pterossauros conhecidos, tinha uma envergadura de asas comparável a um pequeno avião, chegando a 11 metros.",

        "Durante o Período Carbonífero, há cerca de 300 milhões de anos, os níveis de oxigênio eram tão altos que libélulas chegavam a ter asas com mais de 70 cm de envergadura.",

        "O Anomalocaris, um predador marinho do Cambriano, tinha olhos compostos com mais de 16 mil lentes, proporcionando uma visão excepcional.",

        "Algumas espécies de preguiças-gigantes, como o Megatherium, podiam alcançar mais de 6 metros de altura quando se apoiavam nas patas traseiras.",

        "No Triássico, os continentes estavam unidos em um único supercontinente chamado Pangeia, o que facilitava a dispersão de animais pelo planeta.",

        "Os primeiros mamíferos surgiram durante a era dos dinossauros, mas eram pequenos e noturnos, vivendo à sombra dos grandes répteis.",

        "O Dunkleosteus, um peixe blindado do Devoniano, possuía mandíbulas capazes de exercer uma pressão suficiente para cortar quase qualquer coisa.",

        "As coníferas, como os pinheiros, já existiam antes dos dinossauros e foram uma das principais fontes de alimento para muitos herbívoros pré-históricos.",

        "No Cretáceo, a Antártica era coberta por florestas temperadas e abrigava diversos dinossauros, pois o clima era muito mais quente do que hoje."

    ];

    let shuffledTrivia = [];
    let currentTriviaIndex = 0;

    function shuffleTrivia() {
        shuffledTrivia = [...trivia];
        for (let i = shuffledTrivia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledTrivia[i], shuffledTrivia[j]] = [shuffledTrivia[j], shuffledTrivia[i]];
        }
        currentTriviaIndex = 0;
    }

    function showNextTrivia() {
        if (currentTriviaIndex >= shuffledTrivia.length) {
            shuffleTrivia();
        }
        curiosidadeContainer.classList.add('fade-out');
        setTimeout(() => {
            curiosidadeContainer.innerHTML = `<strong>Você sabia?</strong><br>${shuffledTrivia[currentTriviaIndex]}`;
            currentTriviaIndex++;
            curiosidadeContainer.classList.remove('fade-out');
        }, 500);
    }
    
    if (curiosidadeContainer) {
        shuffleTrivia();
        showNextTrivia();
        setInterval(showNextTrivia, 20000);
    }
}