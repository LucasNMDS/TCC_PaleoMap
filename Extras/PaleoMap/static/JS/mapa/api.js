// api.js - Funções de comunicação com o backend

export async function fetchData() {
    const response = await fetch('/api/dados_fosseis/');
    if (!response.ok) {
        throw new Error(`Erro ao comunicar com o servidor: ${response.statusText}`);
    }
    return await response.json();
}