class DiscosAPI {
  constructor() {
    this.apiUrl = "https://ucsdiscosapi.azurewebsites.net/Discos";
    this.authToken = null;
    this.currentPage = 1;
    this.pageSize = 7;
    this.numeroInicio = 1;
    this.maxRecords = 99;
    this.allRecordsLoaded = false;
  }

  // Função para autenticar e obter o token
  authenticate() {
    $("#loading").removeClass("d-none"); // Exibe o loader

    fetch(`${this.apiUrl}/autenticar`, {
      method: "POST",
      headers: {
        accept: "*/*",
        ChaveApi: "8175fA5f6098c5301022f475da32a2aa", // Inclui a chave no cabeçalho
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro na resposta da autenticação");
        }
        return response.text();
      })
      .then((token) => {
        try {
          this.authToken = token;
          this.loadAlbums();
        } catch (error) {
          alert("Erro ao autenticar. Resposta inválida da API.");
        }
      })
      .catch((error) => {
        alert("Erro ao autenticar. Tente novamente.");
        console.error(error);
      })
      .finally(() => $("#loading").addClass("d-none")); // Esconde o loader
  }

  loadAlbums() {
    if (!this.authToken) return; 

    if (this.allRecordsLoaded) {
      alert("Todos os registros carregados.");

      $("html, body").animate({ scrollTop: 0 }, "slow"); 
      return; 
    }

    $("#loading").removeClass("d-none"); // Exibe o loader

    fetch(
      `${this.apiUrl}/records?numeroInicio=${this.numeroInicio}&quantidade=${this.pageSize}`,
      {
        method: "GET",
        headers: {
          accept: "*/*",
          TokenApiUCS: this.authToken,
        },
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro na resposta da autenticação");
        }
        return response.json();
      })
      .then((data) => {
        if (data.length > 0) {
          this.renderAlbums(data);

          // Verifica se estamos no ultimo carregamento
          if (this.numeroInicio + this.pageSize > this.maxRecords) {
            this.numeroInicio = this.maxRecords;
            this.allRecordsLoaded = true;
          } else {
            this.numeroInicio += this.pageSize;
          }

          console.log("Próximo numeroInicio:", this.numeroInicio);
        }
      })
      .catch((error) => {
        alert("Erro ao carregar álbuns.");
        console.error(error);
      })
      .finally(() => {
        $("#loading").addClass("d-none"); 
      });
  }

  // Função para renderizar os álbuns na tela
  renderAlbums(albums) {
    const gallery = $("#album-gallery");
    albums.forEach((album) => {
      const albumCard = `
                <article class="card-main" data-id="${album.id}">
                    <img class="img" src="data:image/jpeg;base64,${album.imagemEmBase64}" alt="${album.descricaoPrimaria}" />
                        <div class="card-body">
                            <h5 class="title">${album.id} - ${album.descricaoPrimaria}</h5>
                            <span class="description">${album.descricaoSecundaria}</span>
                        </div>
                </article>
            `;
      gallery.append(albumCard);
    });

    // Adiciona o evento de clique nas capas dos álbuns
    $(".card-main").on("click", (event) => {
      const albumId = $(event.currentTarget).data("id");
      this.showAlbumDetails(albumId);
    });
  }

  // Função para exibir detalhes de um álbum na modal
  showAlbumDetails(albumId) {
    $("#loading").removeClass("d-none"); // Exibe o loader

    fetch(`${this.apiUrl}/record?numero=${albumId}`, {
      method: "GET",
      headers: {
        accept: "*/*",
        TokenApiUCS: this.authToken,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const album = data;
        $("#modal-image").attr(
          "src",
          `data:image/jpeg;base64,${album.imagemEmBase64}`
        );
        $("#modal-title").text(`${album.id} - ${album.descricaoPrimaria}`);
        $("#modal-description").text(album.descricaoSecundaria);
        const modal = new bootstrap.Modal(
          document.getElementById("albumModal")
        );
        modal.show();
      })
      .catch((error) => {
        alert("Erro ao carregar detalhes do álbum.");
        console.error(error);
      })
      .finally(() => $("#loading").addClass("d-none")); // Esconde o loader
  }

  enableInfiniteScroll() {
    $(window).on("scroll", () => {
      if ($(window).scrollTop() + $(window).height() == $(document).height()) {
        this.loadAlbums(); // Carrega mais álbuns quando o usuário chega ao final da página
      }
    });
  }
}

// Iniciar a aplicação
$(document).ready(function () {
  const discosApi = new DiscosAPI();

  // Autentica e começa a carregar os álbuns
  discosApi.authenticate();

  // Ativa a rolagem infinita
  discosApi.enableInfiniteScroll();
});
