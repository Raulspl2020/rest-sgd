class Usuario {
  constructor({
    id = null,
    nombre = "",
    picture = null,
    email = "",
    active = false,
    google = false,
    rol = []
  }) {
    this.id = id;
    this.nombre = nombre;
    this.picture = picture;
    this.email = email;
    this.active = active;
    this.google = google;
    this.rol = rol;
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
  getActive() {
    return this.active;
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
  setActive(active) {
    this.active = active;
  }
  setGoogle(google) {
    this.google = google;
  }
}


module.exports = {
    Usuario
}