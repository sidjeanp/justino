// src/routes/customers.js

const express = require("express");
const router = express.Router();
const { Customer } = require("../models");

// Listar todos os clientes
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.findAll({
      attributes: [
        "id",
        "customer_id",
        "name",
        "allow_ai_interaction",
        "summary",
        "next_contact_instructions",
        "permanent_instruction",
        "phone_number",
      ],
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

// Visualizar um cliente específico
router.get("/:id", async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      attributes: [
        "id",
        "customer_id",
        "name",
        "allow_ai_interaction",
        "summary",
        "next_contact_instructions",
        "permanent_instruction",
        "phone_number",
      ],
    });
    if (!customer) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar cliente" });
  }
});

// Atualizar um cliente
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      allow_ai_interaction,
      summary,
      next_contact_instructions,
      permanent_instruction,
      phone_number,
    } = req.body;
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    await customer.update({
      name,
      allow_ai_interaction,
      summary,
      next_contact_instructions,
      permanent_instruction,
      phone_number,
    });

    res.json({ message: "Cliente atualizado com sucesso", customer });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar cliente" });
  }
});

module.exports = router;
