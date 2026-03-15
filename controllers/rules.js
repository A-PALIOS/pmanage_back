import Rules from "../models/rules_model.js";

//GET RULES OR CREATE DEFAULT IF NOT EXISTS
export const getRule = async (req, res) => {
    try {
        let rule = await Rules.findOne();
        if (!rule) {
            rule = await Rules.create({});
        }
        res.status(200).json(rule);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// UPDATE RULES
export const updateRule = async (req, res) => {
    const { time_limit_type, time_limit_value,always_allow_current_week, manager_can_override } = req.body;

    try {
        let rule = await Rules.findOne();
        if (!rule) {
            rule = await Rules.create({});
        }

        await rule.update({
            time_limit_type,
            time_limit_value,
            always_allow_current_week,
            manager_can_override
        });

        res.status(200).json({ msg: "Rule updated successfully", rule });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};
