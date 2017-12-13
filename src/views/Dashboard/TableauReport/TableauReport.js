import React, { Component } from 'react';
import PropTypes from 'prop-types';
import url from 'url';
import { shallowequal } from './utils';
import Tableau from './tableau-api';

/**
 * React Component to render reports created in Tableau.
 *
 * @class TableauReport
 * @extends {Component}
 */
class TableauReport extends Component {

  static propTypes = {
    filters: PropTypes.object,
    url: PropTypes.string,
    parameters: PropTypes.object,
    options: PropTypes.object,
    token: PropTypes.string
  }

  static defaultProps = {
    loading: false,
    parameters: {},
    filters: {},
    options: {}
  }

  state = {
    filters: {},
    parameters: {},
    currentUrl: ''
  }

  componentDidMount() {
    const { filters, parameters, url } = this.props

    this.setState({
      filters,
      parameters,
      currentUrl: url
    })

    this.initTableau();
  }

  componentWillReceiveProps(nextProps) {
    this.initTableau()
    // const isReportChanged = nextProps.url !== this.state.currentUrl;
    // const isFiltersChanged = !shallowequal(this.props.filters, nextProps.filters);
    // const isParametersChanged = !shallowequal(this.props.parameters, nextProps.parameters);
    // const isLoading = this.state.loading;
    //
    // if (isReportChanged) {
    //   this.setState({
    //     currentUrl: nextProps.url
    //   });
    //   this.forceUpdate();
    //   this.initTableau();
    // }
    //
    // if (!isReportChanged && isFiltersChanged && !isLoading) {
    //   this.applyFilters(nextProps.filters);
    // }
    //
    // if (!isReportChanged && isParametersChanged && !isLoading) {
    //   this.applyParameters(nextProps.parameters);
    // }
  }


  /**
   * Gets the url for the tableau report.
   *
   * @returns {String} A constructed url.
   * @memberOf TableauReport
   */
  getUrl() {
    const parsed = url.parse(this.props.url, true);

    let result = parsed.protocol + '//' + parsed.host;
    if (this.props.token) result += '/trusted/' + this.props.token;
    result += parsed.pathname + '?:embed=yes&:comments=no&:toolbar=yes&:refresh=yes';

    return result;
  }

  /**
   * Asynchronously applies filters to the worksheet, excluding those that have
   * already been applied, which is determined by checking against state.
   * @param  {Object} filters
   * @return {void}
   * @memberOf TableauReport
   */
  applyFilters(filters) {
    const REPLACE = Tableau.FilterUpdateType.REPLACE;
    const promises = [];
    console.log(filters)
    this.setState({ loading: true });

    for (const key in filters) {
      if (
        !this.state.filters.hasOwnProperty(key) ||
        !shallowequal(this.state.filters[key], filters[key])
      ) {
        console.log('pushing promises')
        promises.push(
          this.sheet.applyFilterAsync(key, filters[key], REPLACE)
        );
      }
    }

    console.log(promises)

    Promise.all(promises).then(() => { this.setState({ loading: false, filters }) });
  }

  /**
   * Asynchronously applies parameters to the worksheet, excluding those that have
   * already been applied, which is determined by checking against state.
   * @param  {Object} parameters
   * @return {void}
   * @memberOf TableauReport
   */
  applyParameters(parameters) {
    const promises = [];

    for (const key in parameters) {
      if (
        !this.state.parameters.hasOwnProperty(key) ||
        this.state.parameters[key] !== parameters[key]
      ) {
        const val = parameters[key];
        promises.push(this.workbook.changeParameterValueAsync(key, val));
      }
    }

    Promise.all(promises).then(() => this.setState({ loading: false, parameters }));
  }

  /**
   * Initialize the viz via the Tableau JS API.
   * @return {void}
   * @memberOf TableauReport
   */
  initTableau() {
    const vizUrl = this.getUrl();

    const options = {
      ...this.props.filters,
      ...this.props.parameters,
      ...this.props.options,
      onFirstInteractive: () => {
        this.workbook = this.viz.getWorkbook();
        this.sheets = this.workbook.getActiveSheet().getWorksheets();
        this.sheet = this.sheets[0];
        console.log(this.sheets)
        console.log(this.workbook.getActiveSheet())
      }
    };

    if (this.viz) {
      this.viz.dispose();
      this.viz = null;
    }

    this.viz = new Tableau.Viz(this.container, vizUrl, options);
  }

  render() {
    return <div ref={c => this.container = c} />;
  }
}

// TableauReport.propTypes = propTypes;
// TableauReport.defaultProps = defaultProps;

export default TableauReport;