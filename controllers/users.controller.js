const { request, response } = require('express');
const bcrypt = require('bcryptjs');

const User = require('../models/user.model');
const { generateJWT } = require('../helpers/jwt');

const getUsers = async (req, res) => {
	const users = await User.find();

	res.json({
		ok: true,
		users,
	});
};

const createUser = async (req = request, res = response) => {
	const { email, password } = req.body;

	try {
		const emailExists = await User.findOne({ email });

		if (emailExists) {
			return res.status(400).json({
				ok: false,
				msg: 'The email is already registered',
			});
		}

		const user = new User(req.body);

		const salt = bcrypt.genSaltSync();
		user.password = bcrypt.hashSync(password, salt);

		await user.save();

		const token = await generateJWT(user.id);

		res.json({
			ok: true,
			user,
			token,
		});
	} catch (error) {
		res.status(500).json({
			ok: false,
			msg: 'Unexpected error...',
		});
	}
};

const editUser = async (req = request, res = response) => {
	const uid = req.params.id;

	try {
		const userDB = await User.findById(uid);

		if (!userDB) {
			res.status(404).json({
				ok: false,
				msg: 'The user does not exist in the database',
			});
		}

		const { password, google, email, ...fields } = req.body;

		if (userDB.email !== email) {
			const emailExists = await User.findOne({ email });

			if (emailExists) {
				return res.status(400).json({
					ok: false,
					msg: 'There is already a user with this email',
				});
			}
		}

		fields.email = email;
		const updatedUser = await User.findByIdAndUpdate(uid, fields, { new: true });

		res.json({
			ok: true,
			user: updatedUser,
		});
	} catch (error) {
		res.status(500).json({
			ok: false,
			msg: 'Unexpected error...',
		});
	}
};

const deleteUser = async (req = request, res = response) => {
	const uid = req.params.id;

	try {
		const userDB = await User.findById(uid);

		if (!userDB) {
			res.status(404).json({
				ok: false,
				msg: 'The user does not exist in the database',
			});
		}

		await User.findByIdAndDelete(uid);

		res.json({
			ok: true,
			msg: 'User Deleted',
		});
	} catch (error) {
		res.status(500).json({
			ok: false,
			msg: 'Unexpected error...',
		});
	}
};

module.exports = {
	getUsers,
	createUser,
	editUser,
	deleteUser,
};
