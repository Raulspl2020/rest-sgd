class Usuario {
  constructor({
    id = "",
    nombre = "",
    picture = null,
    email = "",
    activate = false,
    google = false
  }) {
    this.id = id;
    this.nombre = nombre;
    this.picture = picture;
    this.email = email;
    this.activate = activate;
    this.google = google;
  }

  getId() {
    return this.id;
  }
  getNombre() {
    return this.nombre;
  }
  getPicture() {
    return this.picture;
  }
  getEmail() {
    return this.email;
  }
  getActivate() {
    return this.activate;
  }
  getGoogle() {
    return this.google;
  }

  setId(id) {
    this.id = id;
  }
  setNombre(nombre) {
    this.nombre = nombre;
  }
  setpicture(picture) {
    this.picture = picture;
  }
  setEmail(email) {
    this.email = email;
  }
  setActivate(activate) {
    this.activate = activate;
  }
  setGoogle(google) {
    this.google = google;
  }
}


module.exports = {
    Usuario
}