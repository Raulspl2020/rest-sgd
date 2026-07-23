import { Router } from "express";
const router = Router();
import {
  cargaPlantillaDescuento,
  consultarPagoInscripcion,
  generarpagoMatricula,
  descargarCargueDescuento,
  descargarRechazadosDescuento,
  listaCargueDescuento,
  eliminarCargueDescuento,
} from "../controllers/matricula";

router.get("/generarpagomatricula/:id_matricula", generarpagoMatricula);
router.get("/generarpagoinscripcion/:id_matricula", consultarPagoInscripcion);
router.post("/CargaPlantillaDescuento", cargaPlantillaDescuento);
router.get("/DescargarCargueDescuento/:codigo", descargarCargueDescuento);
router.get("/DescargarRechazadosDescuento/:codigo", descargarRechazadosDescuento);
router.get("/ListaCargueDescuento", listaCargueDescuento);
router.delete("/eliminarCargueDescuento/:codigo", eliminarCargueDescuento);

export default router;
