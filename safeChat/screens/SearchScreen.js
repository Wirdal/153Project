import React, { Component } from 'react';
import { SearchBar } from 'react-native-elements';
import {
  ScrollView, StyleSheet, View, Text, FlatList, Image, TouchableHighlight,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  InstantSearch, connectInfiniteHits, connectSearchBox,
} from 'react-instantsearch-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userImage: {
    borderRadius: 40,
    height: 80,
    width: 80,
    marginRight: 10,
  },
  searchResult: {
    paddingLeft: 20,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FF7500',
  },
  userNameText: {
    borderBottomColor: '#4A4C56',
    fontSize: 18,
    textAlign: 'center',
    fontFamily: 'regular',
  },
});

const SearchResults = connectInfiniteHits(({
  hits, hasMore, refine, navigation,
}) => {
  /* if there are still results, you can
  call the refine function to load more */
  const onEndReached = () => {
    if (hasMore) {
      refine();
    }
  };

  return (
    <FlatList
      data={hits}
      onEndReached={onEndReached}
      keyExtractor={item => item.objectID}
      renderItem={({ item }) => {
        return (
          <TouchableHighlight
            onPress={
              () => navigation.push('UserProfile', { userID: item.objectID })
            }
          >
            <View style={styles.searchResult}>
              <View style={{ flexDirection: 'column' }}>
                <View style={styles.userNameRow}>
                  <Text style={styles.userNameText}>{item.username}</Text>
                </View>
              </View>
            </View>
          </TouchableHighlight>
        );
      }}
    />
  );
});

const SearchBox = connectSearchBox(({
  refine, currentRefinement, onChangeText,
}) => (
  <SearchBar
    placeholder="Search by username..."
    onChangeText={(text) => {
      refine(text);
      onChangeText(text);
    }}
    value={currentRefinement}
    spellCheck={false}
    autoCorrect={false}
    autoCapitalize="none"
    containerStyle={{ backgroundColor: 'transparent', borderTopWidth: 0, borderBottomWidth: 0 }}
    inputContainerStyle={{ backgroundColor: 'white' }}
  />
));

class SearchScreen extends Component {
  static navigationOptions = {
    tabBarIcon: ({ tintColor }) => (<Icon name="magnify" size={24} color={tintColor} />),
  };

  constructor(props) {
    super(props);
    const { navigation } = this.props;

    this.state = {
      text: navigation.getParam('searchString', ''),
    };
  }

  render() {
    const { navigation } = this.props;
    const { text } = this.state;

    return (
      <ScrollView style={styles.container}>
        <InstantSearch
          appId="U07JERX355"
          apiKey="579fd0203367e26270516c1c45dd2840"
          indexName="users"
        >
          <SearchBox
            defaultRefinement={text}
            onChangeText={newText => this.setState({ text: newText })}
          />
          <SearchResults navigation={navigation} searchIndex="users" />
        </InstantSearch>
      </ScrollView>
    );
  }
}

export default SearchScreen;
