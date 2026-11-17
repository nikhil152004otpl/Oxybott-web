const productsService = require('../services/products.service');
const { recordAuditLog } = require('../middleware/auth');
const { query } = require('../config/db');
const path = require('path');
const fs = require('fs');

class ProductsController {
  async getProducts(req, res) {
    try {
      const products = await productsService.getProducts(req.query);
      res.json({ success: true, count: products.length, products });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getProductBySlugOrId(req, res) {
    try {
      const product = await productsService.getProductBySlugOrId(req.params.slugOrId);
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found.' });
      }
      res.json({ success: true, product });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminGetProducts(req, res) {
    try {
      const data = await productsService.adminGetProducts(req.query);
      res.json({ success: true, ...data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminGetProductById(req, res) {
    try {
      const product = await productsService.adminGetProductById(req.params.id);
      if (!product) return res.status(404).json({ success: false, error: 'Product not found.' });
      res.json({ success: true, product });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminCreateProduct(req, res) {
    try {
      const { name, price, sku } = req.body;
      if (!name || !price || !sku) {
        return res.status(400).json({ success: false, error: 'Product Name, SKU, and Price are required.' });
      }

      const result = await productsService.createProduct(req.body);
      await recordAuditLog(req, 'CREATE_PRODUCT', 'PRODUCT', result.productId, `Created product "${name}" (SKU: ${sku})`);

      res.status(201).json({
        success: true,
        message: 'Product created successfully.',
        productId: result.productId,
        slug: result.slug
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminUpdateProduct(req, res) {
    try {
      const { id } = req.params;
      await productsService.updateProduct(id, req.body);
      await recordAuditLog(req, 'UPDATE_PRODUCT', 'PRODUCT', id, `Updated product "${req.body.name || id}"`);
      res.json({ success: true, message: 'Product updated successfully.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminTogglePublish(req, res) {
    try {
      const { id } = req.params;
      const { is_published } = req.body;
      const val = await productsService.togglePublish(id, is_published);
      await recordAuditLog(req, val ? 'PUBLISH' : 'UNPUBLISH', 'PRODUCT', id, `Changed publication status to ${val ? 'Published' : 'Draft'}`);
      res.json({ success: true, is_published: val });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminDuplicateProduct(req, res) {
    try {
      const { id } = req.params;
      const newId = await productsService.duplicateProduct(id);
      await recordAuditLog(req, 'DUPLICATE_PRODUCT', 'PRODUCT', newId, `Duplicated from product ${id}`);
      res.status(201).json({ success: true, message: 'Product duplicated successfully.', newId });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminDeleteProduct(req, res) {
    try {
      const { id } = req.params;
      const deleted = await productsService.deleteProduct(id);
      if (!deleted) return res.status(404).json({ success: false, error: 'Product not found.' });

      await recordAuditLog(req, 'DELETE_PRODUCT', 'PRODUCT', id, `Deleted product "${deleted.name}" (${deleted.sku})`);
      res.json({ success: true, message: 'Product deleted successfully.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async uploadProductImages(req, res) {
    try {
      const { id } = req.params;
      const prodRes = await query('SELECT id, name FROM products WHERE id = $1', [id]);
      if (prodRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Product not found.' });
      const product = prodRes.rows[0];

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, error: 'No files were uploaded.' });
      }

      const mainCheck = await query('SELECT id FROM product_images WHERE product_id = $1 AND is_main = TRUE', [id]);
      const hasMain = mainCheck.rows.length > 0;

      const uploaded = [];
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const webPath = `/uploads/products/${file.filename}`;
        const isMain = (!hasMain && i === 0);

        const insRes = await query(`
          INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_main)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [id, webPath, product.name, 99 + i, isMain]);

        uploaded.push({ id: insRes.rows[0].id, image_url: webPath, is_main: isMain });
      }

      await recordAuditLog(req, 'UPLOAD_IMAGES', 'PRODUCT', id, `Uploaded ${req.files.length} image(s)`);
      res.json({ success: true, uploaded });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async setMainImage(req, res) {
    try {
      const { id, imageId } = req.params;
      await query('UPDATE product_images SET is_main = FALSE WHERE product_id = $1', [id]);
      await query('UPDATE product_images SET is_main = TRUE WHERE product_id = $1 AND id = $2', [id, imageId]);
      await recordAuditLog(req, 'SET_MAIN_IMAGE', 'PRODUCT', id, `Set image ${imageId} as main image`);
      res.json({ success: true, message: 'Main image updated.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteProductImage(req, res) {
    try {
      const { id, imageId } = req.params;
      const imgRes = await query('SELECT image_url, is_main FROM product_images WHERE product_id = $1 AND id = $2', [id, imageId]);
      if (imgRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Image not found.' });
      const img = imgRes.rows[0];

      await query('DELETE FROM product_images WHERE id = $1', [imageId]);

      if (img.is_main) {
        const nextImg = await query('SELECT id FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC LIMIT 1', [id]);
        if (nextImg.rows.length > 0) {
          await query('UPDATE product_images SET is_main = TRUE WHERE id = $1', [nextImg.rows[0].id]);
        }
      }

      if (img.image_url.startsWith('/uploads/')) {
        const diskPath = path.resolve('.' + img.image_url);
        if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
      }

      await recordAuditLog(req, 'DELETE_IMAGE', 'PRODUCT', id, `Deleted image ${imageId}`);
      res.json({ success: true, message: 'Image deleted.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new ProductsController();

