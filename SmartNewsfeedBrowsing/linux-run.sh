#!/usr/bin/env bash
ng build && npx cap sync android && npx cap copy android && npx cap open android