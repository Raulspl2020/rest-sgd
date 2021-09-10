interface Usuario {


  id: string;
  nombre: string;
  picture?: string;
  email: string;
  active: boolean;
  google?: boolean;
  sesion_id?: string;
  rol: any;
  permisos?: any;

  //   constructor({ id:1, nombre: string, picture: string, email: string, active: boolean, google: boolean, rol: []
  //   }) {
  //     this.id = ;
  //     this.nombre = nombre;
  //     this.picture = picture;
  //     this.email = email;
  //     this.active = active;
  //     this.google = google;
  //     this.rol = rol;
  //   }


  //   getId() {
  //     return this.id;
  //   }
  //   getNombre() {
  //     return this.nombre;
  //   }
  //   getPicture() {
  //     return this.picture;
  //   }
  //   getEmail() {
  //     return this.email;
  //   }
  //   getActive() {
  //     return this.active;
  //   }
  //   getGoogle() {
  //     return this.google;
  //   }

  //   setId(id: any) {
  //     this.id = id;
  //   }
  //   setNombre(nombre: any) {
  //     this.nombre = nombre;
  //   }
  //   setpicture(picture: any) {
  //     this.picture = picture;
  //   }
  //   setEmail(email: any) {
  //     this.email = email;
  //   }
  //   setActive(active: boolean) {
  //     this.active = active;
  //   }
  //   setGoogle(google: boolean) {
  //     this.google = google;
  //   }
}


export {
  Usuario
}