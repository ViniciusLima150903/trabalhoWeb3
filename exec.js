class DiscosAPI {
  constructor() {
    this.apiUrl = "https://ucsdiscosapi.azurewebsites.net/Discos";
    this.authToken = null;
    this.pageSize = 12; // Inicia com 12 registros
    this.numeroInicio = 1;
    this.maxRecords = 105; // Total de registros na API
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
        this.authToken = token;
        this.loadAlbums(); // Carrega os álbuns após autenticar
      })
      .catch((error) => {
        alert("Erro ao autenticar. Tente novamente.");
        console.error(error);
      })
      .finally(() => $("#loading").addClass("d-none")); // Esconde o loader
  }

  loadAlbums() {
    if (!this.authToken || this.allRecordsLoaded) return;

    $("#loading").removeClass("d-none"); // Exibe o loader

    const quantidade = Math.min(this.pageSize, this.maxRecords - this.numeroInicio + 1); // Calcula a quantidade de registros a carregar

    fetch(
      `${this.apiUrl}/records?numeroInicio=${this.numeroInicio}&quantidade=${quantidade}`,
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
          throw new Error("Erro na resposta da API");
        }
        return response.json();
      })
      .then((data) => {
        if (data.length > 0) {
          this.renderAlbums(data);

          this.numeroInicio += data.length; // Avança o número inicial

          // Verifica se o último registro foi carregado
          if (this.numeroInicio > this.maxRecords) {
            this.allRecordsLoaded = true; // Marca que todos os registros foram carregados
            this.promptRestart(); // Exibe a mensagem de reinício
          }
        } else {
          this.allRecordsLoaded = true; // Marca como concluído se nenhum dado for retornado
          this.promptRestart(); // Exibe a mensagem de reinício
        }

        console.log("Próximo numeroInicio:", this.numeroInicio);
      })
      .catch((error) => {
        alert("Erro ao carregar álbuns.");
        console.error(error);
      })
      .finally(() => {
        $("#loading").addClass("d-none");
      });
  }

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

    // Adiciona o evento de clique nos álbuns
    $(".card-main").on("click", (event) => {
      const albumId = $(event.currentTarget).data("id");
      this.showAlbumDetails(albumId);
    });
  }

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
        this.pageSize = 4; // Carrega 4 registros por vez no scroll
        this.loadAlbums(); // Carrega mais álbuns
      }
    });
  }

  promptRestart() {
    if (this.allRecordsLoaded) {
      const restart = confirm("Todos os registros carregados. Deseja voltar para o início?");
      if (restart) {
        $("html, body").animate({ scrollTop: 0 }, "slow");
        this.resetGallery();
      }
    }
  }

  resetGallery() {
    this.numeroInicio = 1;
    this.allRecordsLoaded = false;
    this.pageSize = 12; // Reinicia o carregamento com 12 registros
    $("#album-gallery").empty(); // Limpa os álbuns carregados
    this.loadAlbums(); // Carrega os álbuns novamente
  }
}

// Iniciar a aplicação
$(document).ready(function () {
  const discosApi = new DiscosAPI();

  // Autentica e carrega os álbuns iniciais
  discosApi.authenticate();

  // Ativa o carregamento infinito
  discosApi.enableInfiniteScroll();
});
