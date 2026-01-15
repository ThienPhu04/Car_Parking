module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: [
          '.ios.ts',
          '.android.ts',
          '.ts',
          '.ios.tsx',
          '.android.tsx',
          '.tsx',
          '.jsx',
          '.js',
          '.json',
        ],
        alias: {
          '@shared': './src/shared',
          '@features': './src/features',
          '@services': './src/services',
          '@store': './src/store',
          '@app-types': './src/types',
          '@utils': './src/shared/utils',
          '@constants': './src/shared/constants',
          '@components': './src/shared/components',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};