class DiscosAPI {
    constructor() {
        this.apiUrl = 'https://ucsdiscosapi.azurewebsites.net/Discos';
        this.authToken = null;
        this.currentPage = 1;  // Página inicial para carregar álbuns
        this.pageSize = 12;    // Quantidade de registros por página
    }

    // Função para autenticar e obter o token
    authenticate() {
        $('#loading').removeClass('d-none');  // Exibe o loader

        fetch(`${this.apiUrl}/autenticar`, {
            method: 'POST',
            headers: {
                'accept': '*/*'
            }
        })
        .then(response => response.json())
        .then(data => {
            this.authToken = data.TokenApiUCS;  // Armazena o token
            this.loadAlbums();  // Carrega os álbuns após a autenticação
        })
        .catch(error => {
            alert("Erro ao autenticar. Tente novamente.");
            console.error(error);
        })
        .finally(() => $('#loading').addClass('d-none'));  // Esconde o loader
    }

    // Função para carregar os álbuns (records)
    loadAlbums() {
        if (!this.authToken) return;  // Se não houver token, não faz nada

        $('#loading').removeClass('d-none');  // Exibe o loader

        fetch(`${this.apiUrl}/records?numero=${this.currentPage}&quantidade=${this.pageSize}`, {
            method: 'GET',
            headers: {
                'accept': '*/*',
                'TokenApiUCS': this.authToken
            }
        })
        .then(response => response.json())
        .then(data => {
            const albums = data.records;
            this.renderAlbums(albums);
            this.currentPage++;  // Incrementa a página para o próximo carregamento
        })
        .catch(error => {
            alert("Erro ao carregar álbuns.");
            console.error(error);
        })
        .finally(() => $('#loading').addClass('d-none'));  // Esconde o loader
    }

    // Função para renderizar os álbuns na tela
    renderAlbums(albums) {
        const gallery = $('#album-gallery');
        albums.forEach(album => {
            const albumCard = `
                <div class="col-md-4 mb-4">
                    <div class="card" data-id="${album.id}">
                        <img src="${album.coverImageUrl}" class="card-img-top" alt="${album.title}">
                        <div class="card-body">
                            <h5 class="card-title">${album.title}</h5>
                        </div>
                    </div>
                </div>
            `;
            gallery.append(albumCard);
        });

        // Adiciona o evento de clique nas capas dos álbuns
        $('.card').on('click', (event) => {
            const albumId = $(event.currentTarget).data('id');
            this.showAlbumDetails(albumId);
        });
    }

    // Função para exibir detalhes de um álbum na modal
    showAlbumDetails(albumId) {
        $('#loading').removeClass('d-none');  // Exibe o loader

        fetch(`${this.apiUrl}/record?id=${albumId}`, {
            method: 'GET',
            headers: {
                'accept': '*/*',
                'TokenApiUCS': this.authToken
            }
        })
        .then(response => response.json())
        .then(data => {
            const album = data.record;
            $('#modal-image').attr('src', album.coverImageUrl);
            $('#modal-title').text(album.title);
            $('#modal-description').text(album.description);
            const modal = new bootstrap.Modal(document.getElementById('albumModal'));
            modal.show();
        })
        .catch(error => {
            alert("Erro ao carregar detalhes do álbum.");
            console.error(error);
        })
        .finally(() => $('#loading').addClass('d-none'));  // Esconde o loader
    }

    // Função para verificar a rolagem infinita (load more albums)
    enableInfiniteScroll() {
        $(window).on('scroll', () => {
            if ($(window).scrollTop() + $(window).height() == $(document).height()) {
                this.loadAlbums();  // Carrega mais álbuns quando o usuário chega ao final da página
            }
        });
    }
}

// Iniciar a aplicação
$(document).ready(function() {
    const discosApi = new DiscosAPI();
    
    // Autentica e começa a carregar os álbuns
    discosApi.authenticate();

    // Ativa a rolagem infinita
    discosApi.enableInfiniteScroll();
});

