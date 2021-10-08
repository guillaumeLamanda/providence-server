<h1 align="center">Welcome to providence-server 👋</h1>
<p>
  <a href="https://www.npmjs.com/package/providence-server" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/providence-server.svg">
  </a>
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
</p>

> local proxy server, writing response into dataset, and allowing to replay a dataset.

This is a local proxy server. It record the responses, and store it into files.
You can also replay stored responses. It can be useful if you're experiencing down times, or for integration testing.

## Install

```sh
yarn install providence-server
```

## Usage

You can see all options available by using `--help` option.

```sh
providence --help
```

To use the server, you have to specify the proxy host to call :

```sh
providence -h my-awesome-server.fr
```

By default, datas will be stored into providence node_modules folder,
but if you want to store responses in a specific folder, you can use the `--data-folder` option :

```sh
providence -h my-awesome-server.fr -d ./data
```

To replay the current dataset, you can use the `replay` command:

```sh
providence replay
# or if you have a specific data folder
providence replay -d ./data
```

To save a dataset, use the `save` command:

```sh
providence save -n my-dataset-name
# or if you have a specific data folder
providence save -d ./data -n my-dataset-name
```

To list your datasets, use le `list` (or `ls`) command:

```sh
providence list
# or if you have a specific data folder
providence list -d ./data
```

## Contributing

Contributions, issues and feature requests are welcome!
Feel free to check [issues](https://github.com/guillaumeLamanda/providence-server/issues) page. You can also take a look at the [contributing guide](./CONTRIBUTING.md).

## Author

👤 **Guillaume Lamanda <guillaume.lamanda@gmail.com>**

- Github: [@guillaumeLamanda](https://github.com/guillaumeLamanda)

This project was created while I was working for [Aumaxpourmoi](https://www.aumaxpourmoi.fr/).

## Show your support

Give a ⭐️ if this project helped you!

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
