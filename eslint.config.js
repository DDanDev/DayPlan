import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'
import {readFileSync} from 'fs'

export default tseslint.config(
    {
        ignores: [
            'dist',
            ...readFileSync('.gitignore', 'utf8')
                .split('\n')
                .filter((line) => line && !line.startsWith('#')),
        ],
    },
    {
        extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            'react-x': reactX,
            'react-dom': reactDom,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': ['warn', {allowConstantExport: true}],
            '@typescript-eslint/restrict-template-expressions': ['error', {allowNumber: true}],
            ...reactX.configs['recommended-typescript'].rules,
            ...reactDom.configs.recommended.rules,
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: false,
                },
            ],
            eqeqeq: ['error'],
            '@typescript-eslint/consistent-type-imports': 'error',
        },
    },
)
