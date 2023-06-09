# Commands

## URL Query Parameters

The following URL Query parameter apply to all subsequent command routes **without a /:name parameter**

```json
{
  "category": "The category to filter by",
  "limit": "The maximum amount of commands to return"
}

```

## Chat Input Commands

GET all application Chat Input commands

**URL** : `/api/commands`

**Find by name** : `/api/commands/:name`

**Method** : `GET`

**Response Code** : `200 OK`

**Response Content** : Returns an array of client Chat Input commands with your specified command structure

## Context Menu Commands

GET all application Context Menu Commands

**URL** : `/api/commands/context-menus`

**Find by name** : `/api/commands/context-menus/:name`

**Method** : `GET`

**Response Code** : `200 OK`

**Response Content** : Returns an array of client Context Menu Commands with your specified command structure

## Auto-complete options

GET all application Auto-complete options

**URL** : `/api/commands/auto-complete`

**Find by name** : `/api/commands/auto-complete/:name`

**Method** : `GET`

**Response Code** : `200 OK`

**Response Content** : Returns an array of client Auto-complete options with your specified command structure

## Button Actions

GET all application Button Actions

**URL** : `/api/commands/buttons`

**Find by name** : `/api/commands/buttons/:name`

**Method** : `GET`

**Response Code** : `200 OK`

**Response Content** : Returns an array of client Button Actions with your specified command structure

## Modal Prompts

GET all application Modal Prompts

**URL** : `/api/commands/modals`

**Find by name** : `/api/commands/modals/:name`

**Method** : `GET`

**Response Code** : `200 OK`

**Response Content** : Returns an array of client Modal Prompts with your specified command structure

## Select Menu's

GET all application Select Menu's

**URL** : `/api/commands/select-menus`

**Find by name** : `/api/commands/select-menus/:name`

**Method** : `GET`

**Response Code** : `200 OK`

**Response Content** : Returns an array of client Select Menu's with your specified command structure
