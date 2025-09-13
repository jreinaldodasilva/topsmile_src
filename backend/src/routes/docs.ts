import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger';

const router = express.Router();

// Swagger UI
/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Interface Swagger UI
 *     description: Exibe a documentação interativa da API usando Swagger UI
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Swagger UI carregado com sucesso
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: HTML da interface Swagger UI
 */
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    syntaxHighlight: {
      activate: true,
      theme: 'arta'
    }
  }
}));

/**
 * @swagger
 * /api/docs/json:
 *   get:
 *     summary: Especificação JSON do Swagger
 *     description: Retorna a especificação JSON da API para uso em ferramentas externas
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Especificação JSON retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

export default router;
